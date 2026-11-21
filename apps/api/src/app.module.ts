import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CouponsModule } from './coupons/coupons.module';
import { ShippingModule } from './shipping/shipping.module';
import { CmsModule } from './cms/cms.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { AdminModule } from './admin/admin.module';
import { SellersModule } from './sellers/sellers.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { validateEnv } from './config/env.validation';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

const webDistCandidates = [
  join(__dirname, '..', '..', 'public'), // apps/api/public (Docker)
  join(__dirname, '..', '..', '..', 'web', 'dist'), // monorepo from dist/src
  join(process.cwd(), 'public'),
  join(process.cwd(), '..', 'web', 'dist'),
];
export const WEB_DIST_PATH = webDistCandidates.find((p) =>
  existsSync(join(p, 'index.html')),
);
const staticImports = WEB_DIST_PATH
  ? [
      ServeStaticModule.forRoot({
        rootPath: WEB_DIST_PATH,
        exclude: ['/api/(.*)'],
        serveStaticOptions: {
          index: false,
        },
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: process.env.NODE_ENV === 'production' ? 100 : 200,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    ShippingModule,
    CmsModule,
    ReportsModule,
    SettingsModule,
    SellersModule,
    AdminModule,
    ...staticImports,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
