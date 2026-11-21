import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'lunaire-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'lunaire-api',
        database: 'unavailable',
      });
    }
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'alive' };
  }

  @Public()
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready' };
  }
}
