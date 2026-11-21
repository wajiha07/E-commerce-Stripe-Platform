import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CatalogModule } from '../catalog/catalog.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ShippingModule } from '../shipping/shipping.module';
import { CmsModule } from '../cms/cms.module';
import { ReportsModule } from '../reports/reports.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    CategoriesModule,
    OrdersModule,
    UsersModule,
    PaymentsModule,
    CouponsModule,
    ShippingModule,
    CmsModule,
    ReportsModule,
    SettingsModule,
    SellersModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
