import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      orderCount,
      revenueAgg,
      pendingOrders,
      customerCount,
      recentOrders,
      topProducts,
      paymentsSucceeded,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: since },
          status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.SUCCEEDED } }),
    ]);

    return {
      salesLast30Days: orderCount,
      revenueLast30Days: Number(revenueAgg._sum.total || 0),
      pendingOrders,
      customerCount,
      successfulPayments: paymentsSucceeded,
      recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
      topProducts: topProducts.map((p) => ({
        productName: p.productName,
        quantity: p._sum.quantity || 0,
        revenue: Number(p._sum.lineTotal || 0),
      })),
    };
  }

  async salesReport(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, number>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + Number(o.total));
    }
    return Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue }));
  }
}
