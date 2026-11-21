import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  banners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  allBanners() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createBanner(data: Prisma.BannerCreateInput) {
    return this.prisma.banner.create({ data });
  }

  async updateBanner(id: string, data: Prisma.BannerUpdateInput) {
    await this.ensureBanner(id);
    return this.prisma.banner.update({ where: { id }, data });
  }

  async removeBanner(id: string) {
    await this.ensureBanner(id);
    return this.prisma.banner.delete({ where: { id } });
  }

  private async ensureBanner(id: string) {
    const b = await this.prisma.banner.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Banner not found');
  }
}
