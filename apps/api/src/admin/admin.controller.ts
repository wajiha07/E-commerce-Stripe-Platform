import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CatalogService } from '../catalog/catalog.service';
import { CategoriesService } from '../categories/categories.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { CouponsService } from '../coupons/coupons.service';
import { ShippingService } from '../shipping/shipping.service';
import { CmsService } from '../cms/cms.service';
import { ReportsService } from '../reports/reports.service';
import { SettingsService } from '../settings/settings.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from '../catalog/dto/product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from '../categories/dto/category.dto';
import { UpdateOrderStatusDto } from '../orders/dto/checkout.dto';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

class CreateStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(Role)
  role!: Role;
}

class UpdateStaffDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT)
export class AdminController {
  constructor(
    private catalog: CatalogService,
    private categories: CategoriesService,
    private orders: OrdersService,
    private users: UsersService,
    private payments: PaymentsService,
    private couponsService: CouponsService,
    private shippingService: ShippingService,
    private cms: CmsService,
    private reports: ReportsService,
    private settings: SettingsService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.reports.dashboard();
  }

  @Get('reports/sales')
  sales(@Query('days') days?: string) {
    return this.reports.salesReport(days ? Number(days) : 30);
  }

  @Get('products')
  products(@Query() query: ProductQueryDto) {
    return this.catalog.list(query, true);
  }

  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.catalog.byId(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalog.create(dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalog.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.catalog.remove(id);
  }

  @Get('categories')
  listCategories() {
    return this.categories.listAll();
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.categories.remove(id);
  }

  @Get('orders')
  listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.orders.listAdmin({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      search,
    });
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.orders.getAdmin(id);
  }

  @Patch('orders/:id/status')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.trackingNumber, dto.fulfillmentStatus);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('orders/:id/refund')
  refund(@Param('id') id: string, @Body() body: { amount?: number }) {
    return this.payments.refundOrder(id, body.amount);
  }

  @Get('customers')
  customers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.users.listCustomers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search,
    );
  }

  @Get('customers/:id')
  customer(@Param('id') id: string) {
    return this.users.getCustomer(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('customers/:id/active')
  setCustomerActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.users.setActive(id, body.isActive);
  }

  @Get('payments')
  paymentsList(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.payments.list(page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Get('coupons')
  listCoupons() {
    return this.couponsService.list();
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('coupons')
  createCoupon(@Body() body: any) {
    return this.couponsService.create(body);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  @Get('shipping')
  listShipping() {
    return this.shippingService.listAll();
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('shipping')
  createShipping(@Body() body: any) {
    return this.shippingService.create(body);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('shipping/:id')
  updateShipping(@Param('id') id: string, @Body() body: any) {
    return this.shippingService.update(id, body);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('shipping/:id')
  deleteShipping(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }

  @Get('banners')
  banners() {
    return this.cms.allBanners();
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('banners')
  createBanner(@Body() body: any) {
    return this.cms.createBanner(body);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('banners/:id')
  updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.cms.updateBanner(id, body);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.cms.removeBanner(id);
  }

  @Get('settings')
  getSettings() {
    return this.settings.getAll();
  }

  @Roles(Role.ADMIN)
  @Patch('settings/:key')
  upsertSetting(@Param('key') key: string, @Body() body: { value: unknown }) {
    return this.settings.upsert(key, body.value);
  }

  @Roles(Role.ADMIN)
  @Get('staff')
  staff() {
    return this.users.listStaff();
  }

  @Roles(Role.ADMIN)
  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.users.createStaff(dto);
  }

  @Roles(Role.ADMIN)
  @Patch('staff/:id')
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.users.updateStaff(id, dto);
  }
}
