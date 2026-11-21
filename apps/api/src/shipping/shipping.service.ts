import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  listPublic() {
    return this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAll() {
    return this.prisma.shippingMethod.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  create(data: Prisma.ShippingMethodCreateInput) {
    return this.prisma.shippingMethod.create({ data });
  }

  async update(id: string, data: Prisma.ShippingMethodUpdateInput) {
    await this.ensure(id);
    return this.prisma.shippingMethod.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.shippingMethod.delete({ where: { id } });
  }

  private async ensure(id: string) {
    const m = await this.prisma.shippingMethod.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Shipping method not found');
  }
}
