import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private coupons: CouponsService,
    private payments: PaymentsService,
    private cart: CartService,
  ) {}

  private orderNumber() {
    const n = Date.now().toString(36).toUpperCase();
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `LN-${n}-${r}`;
  }

  async checkout(userId: string | undefined, dto: CheckoutDto) {
    const cart = await this.cart.getOrCreate(userId, dto.guestId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    const shipping = await this.prisma.shippingMethod.findFirst({
      where: { id: dto.shippingMethodId, isActive: true },
    });
    if (!shipping) throw new BadRequestException('Invalid shipping method');

    let discountAmount = 0;
    let couponId: string | undefined;
    if (dto.couponCode) {
      const coupon = await this.coupons.validate(dto.couponCode, cart.subtotal);
      discountAmount = coupon.discountAmount;
      couponId = coupon.id;
    }

    const shippingAmount = Number(shipping.price);
    const taxAmount = Math.round((cart.subtotal - discountAmount) * 0.08 * 100) / 100;
    const total =
      Math.round((cart.subtotal - discountAmount + shippingAmount + taxAmount) * 100) / 100;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: this.orderNumber(),
          userId,
          email: dto.email.toLowerCase(),
          status: OrderStatus.PENDING,
          subtotal: cart.subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          total,
          couponId,
          shippingMethodId: shipping.id,
          shippingName: dto.shippingName,
          shippingLine1: dto.shippingLine1,
          shippingLine2: dto.shippingLine2,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
          shippingPostal: dto.shippingPostal,
          shippingCountry: dto.shippingCountry,
          shippingPhone: dto.shippingPhone,
          notes: dto.notes,
          items: {
            create: cart.items.map((item: any) => ({
              variantId: item.variantId,
              productName: item.product.name,
              variantSku: item.sku,
              size: item.size,
              color: item.color,
              unitPrice: item.price,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              imageUrl: item.product.imageUrl,
            })),
          },
          payment: {
            create: {
              amount: total,
              currency: 'usd',
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: { items: true, payment: true },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    const paymentIntent = await this.payments.createPaymentIntent(order.id, total);

    return {
      order: this.serialize(order),
      clientSecret: paymentIntent.clientSecret,
      publishableKey: this.payments.publishableKey,
    };
  }

  private serialize(order: any) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingAmount: Number(order.shippingAmount),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      items: order.items?.map((i: any) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
      payment: order.payment
        ? {
            ...order.payment,
            amount: Number(order.payment.amount),
            refundedAmount: Number(order.payment.refundedAmount),
          }
        : null,
    };
  }

  async myOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true, payment: true, shippingMethod: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.serialize(o));
  }

  async myOrder(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payment: true, shippingMethod: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serialize(order);
  }

  async byNumberPublic(orderNumber: string, email: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, email: email.toLowerCase() },
      include: { items: true, payment: true, shippingMethod: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serialize(order);
  }

  async confirmation(id: string, userId?: string, email?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, shippingMethod: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId === userId) return this.serialize(order);
    if (email && order.email === email.toLowerCase()) return this.serialize(order);
    if (!userId && !email) throw new NotFoundException('Order not found');
    throw new NotFoundException('Order not found');
  }

  async listAdmin(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status as OrderStatus } : {}),
      ...(params.search
        ? {
            OR: [
              { orderNumber: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
              { shippingName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, payment: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items: items.map((o) => this.serialize(o)), total, page, limit };
  }

  async getAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        shippingMethod: true,
        coupon: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serialize(order);
  }

  async updateStatus(
    id: string,
    status: string,
    trackingNumber?: string,
    fulfillmentStatus?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (status === OrderStatus.CANCELLED && order.status === OrderStatus.PAID) {
      await this.payments.refundOrder(id);
    }

    if (status === OrderStatus.CANCELLED && [OrderStatus.PENDING, OrderStatus.PAID].includes(order.status as any)) {
      // restock handled in payments.refundOrder for paid; for pending just cancel
      if (order.status === OrderStatus.PENDING) {
        // no inventory was decremented yet
      }
    }

    return this.serialize(
      await this.prisma.order.update({
        where: { id },
        data: {
          status: status as OrderStatus,
          ...(trackingNumber !== undefined ? { trackingNumber } : {}),
          ...(fulfillmentStatus !== undefined ? { fulfillmentStatus } : {}),
        },
        include: { items: true, payment: true },
      }),
    );
  }

  async markPaidAndDecrementStock(orderId: string, paymentIntentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });
      if (!order) return null;
      if (order.status === OrderStatus.PAID) return order;

      for (const item of order.items) {
        if (!item.variantId) continue;
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException('Stock conflict after payment');
        }
      }

      await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: paymentIntentId,
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, fulfillmentStatus: 'unfulfilled' },
        include: { items: true, payment: true },
      });
    });
  }
}
