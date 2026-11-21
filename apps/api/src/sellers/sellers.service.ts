import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, SellerStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSellerDto, UpdateSellerDto } from './dto/seller.dto';

@Injectable()
export class SellersService {
  private stripe: Stripe | null = null;
  private readonly mockMode: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY') || '';
    this.mockMode =
      !key || key.includes('placeholder') || key.includes('_mock_');
    if (!this.mockMode) {
      this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
  }

  private slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async register(userId: string, dto: RegisterSellerDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role === Role.ADMIN || user.role === Role.MANAGER || user.role === Role.SUPPORT) {
      throw new BadRequestException('Staff accounts cannot become sellers');
    }

    const existing = await this.prisma.seller.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Seller profile already exists');

    let slug = this.slugify(dto.storeName);
    const clash = await this.prisma.seller.findUnique({ where: { storeSlug: slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const fee = Number(this.config.get('PLATFORM_FEE_PERCENT') || 10);

    const seller = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.SELLER },
      });
      return tx.seller.create({
        data: {
          userId,
          storeName: dto.storeName,
          storeSlug: slug,
          description: dto.description,
          status: SellerStatus.PENDING,
          platformFeePercent: fee,
        },
      });
    });

    return this.serialize(seller);
  }

  async me(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      include: {
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!seller) throw new NotFoundException('Seller profile not found');
    return this.serialize(seller);
  }

  async updateMe(userId: string, dto: UpdateSellerDto) {
    const seller = await this.ensureByUser(userId);
    const updated = await this.prisma.seller.update({
      where: { id: seller.id },
      data: {
        storeName: dto.storeName,
        description: dto.description,
      },
    });
    return this.serialize(updated);
  }

  async createOnboardingLink(userId: string) {
    const seller = await this.ensureByUser(userId);
    const webOrigin = this.config.get('WEB_ORIGIN') || 'http://localhost:5173';

    if (this.mockMode) {
      const mockAccountId = seller.stripeAccountId || `acct_mock_${seller.id.slice(-8)}`;
      const updated = await this.prisma.seller.update({
        where: { id: seller.id },
        data: {
          stripeAccountId: mockAccountId,
          status: SellerStatus.ACTIVE,
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
        },
      });
      return {
        url: `${webOrigin}/seller?onboarded=mock`,
        mock: true,
        seller: this.serialize(updated),
      };
    }

    let accountId = seller.stripeAccountId;
    if (!accountId) {
      const account = await this.stripe!.accounts.create({
        type: 'express',
        email: (await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })).email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: seller.storeName,
          product_description: seller.description || 'Fashion products on LUNAIRE',
        },
        metadata: { sellerId: seller.id },
      });
      accountId = account.id;
      await this.prisma.seller.update({
        where: { id: seller.id },
        data: {
          stripeAccountId: accountId,
          status: SellerStatus.ONBOARDING,
        },
      });
    }

    const link = await this.stripe!.accountLinks.create({
      account: accountId,
      refresh_url: `${webOrigin}/seller/onboarding?refresh=1`,
      return_url: `${webOrigin}/seller/onboarding?return=1`,
      type: 'account_onboarding',
    });

    return { url: link.url, mock: false };
  }

  async refreshStripeStatus(userId: string) {
    const seller = await this.ensureByUser(userId);
    if (!seller.stripeAccountId) {
      return this.serialize(seller);
    }

    if (this.mockMode || seller.stripeAccountId.startsWith('acct_mock_')) {
      const updated = await this.prisma.seller.update({
        where: { id: seller.id },
        data: {
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          status: SellerStatus.ACTIVE,
        },
      });
      return this.serialize(updated);
    }

    const account = await this.stripe!.accounts.retrieve(seller.stripeAccountId);
    return this.applyAccountStatus(seller.id, account);
  }

  async syncFromStripeAccount(account: Stripe.Account) {
    const seller = await this.prisma.seller.findFirst({
      where: { stripeAccountId: account.id },
    });
    if (!seller) return null;
    return this.applyAccountStatus(seller.id, account);
  }

  private async applyAccountStatus(sellerId: string, account: Stripe.Account) {
    let status: SellerStatus = SellerStatus.ONBOARDING;
    if (account.charges_enabled && account.payouts_enabled) status = SellerStatus.ACTIVE;
    else if (account.requirements?.disabled_reason) status = SellerStatus.RESTRICTED;

    const updated = await this.prisma.seller.update({
      where: { id: sellerId },
      data: {
        chargesEnabled: !!account.charges_enabled,
        payoutsEnabled: !!account.payouts_enabled,
        detailsSubmitted: !!account.details_submitted,
        status,
      },
    });
    return this.serialize(updated);
  }

  async listAdmin() {
    const sellers = await this.prisma.seller.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sellers.map((s) => this.serialize(s));
  }

  async bySlug(slug: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { storeSlug: slug },
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        description: true,
        status: true,
      },
    });
    if (!seller || seller.status === SellerStatus.DISABLED) {
      throw new NotFoundException('Store not found');
    }
    return seller;
  }

  async ensureByUser(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller profile not found');
    return seller;
  }

  async ensureReadyForCheckout(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new BadRequestException('Seller not found');
    if (!seller.stripeAccountId) {
      throw new BadRequestException('Seller has not connected Stripe yet');
    }
    if (!seller.chargesEnabled && !seller.stripeAccountId.startsWith('acct_mock_')) {
      throw new BadRequestException('Seller cannot accept payments yet');
    }
    return seller;
  }

  private serialize(seller: any) {
    return {
      ...seller,
      platformFeePercent: Number(seller.platformFeePercent),
    };
  }
}
