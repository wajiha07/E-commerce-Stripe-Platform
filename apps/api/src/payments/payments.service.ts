import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(PaymentsService.name);
  readonly publishableKey: string;
  private readonly mockMode: boolean;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY') || '';
    this.publishableKey = this.config.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
    this.mockMode =
      !key || key.includes('placeholder') || key.includes('_mock_');
    if (!this.mockMode) {
      this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
  }

  async createPaymentIntent(
    orderId: string,
    amount: number,
    opts: {
      stripeAccountId: string;
      applicationFeeAmount: number;
    },
  ) {
    const amountCents = Math.round(amount * 100);
    const feeCents = Math.round(opts.applicationFeeAmount * 100);

    if (this.mockMode || opts.stripeAccountId.startsWith('acct_mock_')) {
      const mockId = `pi_mock_${orderId}`;
      await this.prisma.payment.update({
        where: { orderId },
        data: {
          stripePaymentIntentId: mockId,
          stripeAccountId: opts.stripeAccountId,
          applicationFeeAmount: opts.applicationFeeAmount,
          status: PaymentStatus.REQUIRES_ACTION,
        },
      });
      return {
        clientSecret: `${mockId}_secret_mock`,
        paymentIntentId: mockId,
        mock: true,
      };
    }

    const intent = await this.stripe!.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
      application_fee_amount: feeCents,
      transfer_data: {
        destination: opts.stripeAccountId,
      },
    });

    await this.prisma.payment.update({
      where: { orderId },
      data: {
        stripePaymentIntentId: intent.id,
        stripeAccountId: opts.stripeAccountId,
        applicationFeeAmount: opts.applicationFeeAmount,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id,
      mock: false,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (this.mockMode) {
      throw new BadRequestException('Stripe not configured');
    }
    const secret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    try {
      event = this.stripe!.webhooks.constructEvent(rawBody, signature || '', secret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err as Error);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        await this.confirmPaid(orderId, intent.id, event);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        await this.prisma.payment.update({
          where: { orderId },
          data: { status: PaymentStatus.FAILED, rawEvent: event as any },
        });
      }
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      const seller = await this.prisma.seller.findFirst({
        where: { stripeAccountId: account.id },
      });
      if (seller) {
        let status = seller.status;
        if (account.charges_enabled && account.payouts_enabled) status = 'ACTIVE' as any;
        else if (account.requirements?.disabled_reason) status = 'RESTRICTED' as any;
        else if (!account.details_submitted) status = 'ONBOARDING' as any;

        await this.prisma.seller.update({
          where: { id: seller.id },
          data: {
            chargesEnabled: !!account.charges_enabled,
            payoutsEnabled: !!account.payouts_enabled,
            detailsSubmitted: !!account.details_submitted,
            status,
          },
        });
      }
    }

    return { received: true };
  }

  async mockConfirm(orderId: string) {
    if (process.env.NODE_ENV === 'production' || !this.mockMode) {
      throw new BadRequestException('Mock confirm disabled');
    }
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.confirmPaid(
      orderId,
      payment.stripePaymentIntentId || `pi_mock_${orderId}`,
      { mock: true },
    );
  }

  async confirmPaid(orderId: string, paymentIntentId: string, rawEvent: unknown) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === OrderStatus.PAID) return this.serializePayment(order.payment!);

      for (const item of order.items) {
        if (!item.variantId) continue;
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          this.logger.error(`Stock conflict for order ${orderId} variant ${item.variantId}`);
        }
      }

      await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: paymentIntentId,
          rawEvent: rawEvent as any,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      const payment = await tx.payment.findUniqueOrThrow({ where: { orderId } });
      return this.serializePayment(payment);
    });
  }

  async refundOrder(orderId: string, amount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true },
    });
    if (!order?.payment) throw new NotFoundException('Payment not found');
    if (
      order.payment.status !== PaymentStatus.SUCCEEDED &&
      order.payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException('Order is not refundable');
    }

    const refundAmount =
      amount ?? Number(order.payment.amount) - Number(order.payment.refundedAmount);

    if (
      !this.mockMode &&
      order.payment.stripePaymentIntentId &&
      !order.payment.stripePaymentIntentId.startsWith('pi_mock')
    ) {
      // Reverse transfer / refund on Connect destination charge
      await this.stripe!.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100),
        reverse_transfer: true,
        refund_application_fee: true,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      const newRefunded = Number(order.payment!.refundedAmount) + refundAmount;
      const fully = newRefunded >= Number(order.payment!.amount);

      await tx.payment.update({
        where: { orderId },
        data: {
          refundedAmount: newRefunded,
          status: fully ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: fully ? OrderStatus.REFUNDED : order.status },
      });
    });

    return this.prisma.payment.findUnique({ where: { orderId } });
  }

  async list(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        include: {
          order: {
            select: {
              orderNumber: true,
              email: true,
              status: true,
              sellerId: true,
              platformFeeAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count(),
    ]);
    return {
      items: items.map((p) => this.serializePayment(p)),
      total,
      page,
      limit,
    };
  }

  private serializePayment(p: any) {
    return {
      ...p,
      amount: Number(p.amount),
      refundedAmount: Number(p.refundedAmount),
      applicationFeeAmount: Number(p.applicationFeeAmount || 0),
      order: p.order
        ? {
            ...p.order,
            platformFeeAmount: p.order.platformFeeAmount != null
              ? Number(p.order.platformFeeAmount)
              : undefined,
          }
        : p.order,
    };
  }
}
