import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CatalogService } from '../catalog/catalog.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from '../catalog/dto/product.dto';
import { OrdersService } from '../orders/orders.service';
import { SellersService } from './sellers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateOrderStatusDto } from '../orders/dto/checkout.dto';

@Controller('sellers/me')
@UseGuards(RolesGuard)
@Roles(Role.SELLER)
export class SellerCatalogController {
  constructor(
    private sellers: SellersService,
    private catalog: CatalogService,
    private orders: OrdersService,
  ) {}

  @Get('products')
  async products(@CurrentUser('id') userId: string, @Query() query: ProductQueryDto) {
    const seller = await this.sellers.ensureByUser(userId);
    return this.catalog.list({ ...query, sellerId: seller.id }, true);
  }

  @Post('products')
  async createProduct(@CurrentUser('id') userId: string, @Body() dto: CreateProductDto) {
    const seller = await this.sellers.ensureByUser(userId);
    return this.catalog.create({ ...dto, sellerId: seller.id });
  }

  @Patch('products/:id')
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const seller = await this.sellers.ensureByUser(userId);
    const product = await this.catalog.byId(id);
    if (product.sellerId !== seller.id) throw new ForbiddenException();
    return this.catalog.update(id, { ...dto, sellerId: seller.id });
  }

  @Delete('products/:id')
  async deleteProduct(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const seller = await this.sellers.ensureByUser(userId);
    const product = await this.catalog.byId(id);
    if (product.sellerId !== seller.id) throw new ForbiddenException();
    return this.catalog.remove(id);
  }

  @Get('orders')
  async ordersList(@CurrentUser('id') userId: string) {
    const seller = await this.sellers.ensureByUser(userId);
    return this.orders.sellerOrders(seller.id);
  }

  @Get('orders/:id')
  async order(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const seller = await this.sellers.ensureByUser(userId);
    return this.orders.sellerOrder(seller.id, id);
  }

  @Patch('orders/:id/status')
  async updateOrder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const seller = await this.sellers.ensureByUser(userId);
    await this.orders.sellerOrder(seller.id, id);
    return this.orders.updateStatus(id, dto.status, dto.trackingNumber, dto.fulfillmentStatus);
  }
}
