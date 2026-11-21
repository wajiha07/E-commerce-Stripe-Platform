import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublic() {
    const rows = await this.prisma.storeSetting.findMany({
      where: { key: { in: ['store', 'shipping_defaults'] } },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async getAll() {
    const rows = await this.prisma.storeSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsert(key: string, value: unknown) {
    return this.prisma.storeSetting.upsert({
      where: { key },
      create: { key, value: value as any },
      update: { value: value as any },
    });
  }
}
