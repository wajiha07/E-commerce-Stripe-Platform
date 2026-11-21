import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon');
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException('Coupon not active yet');
    if (coupon.endsAt && coupon.endsAt < now) throw new BadRequestException('Coupon expired');
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order $${coupon.minOrderAmount}`);
    }

    let discountAmount =
      coupon.discountType === DiscountType.PERCENTAGE
        ? (subtotal * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);
    discountAmount = Math.min(discountAmount, subtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return { id: coupon.id, code: coupon.code, discountAmount };
  }

  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: Prisma.CouponCreateInput) {
    return this.prisma.coupon.create({
      data: { ...data, code: String(data.code).toUpperCase() },
    });
  }

  async update(id: string, data: Prisma.CouponUpdateInput) {
    await this.ensure(id);
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  private async ensure(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
  }
}
