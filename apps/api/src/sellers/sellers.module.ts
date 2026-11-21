import { Module } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { SellerCatalogController } from './seller-catalog.controller';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [AuthModule, CatalogModule, OrdersModule],
  controllers: [SellersController, SellerCatalogController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
