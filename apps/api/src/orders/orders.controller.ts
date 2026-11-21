import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Public()
  @Post('checkout')
  checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.orders.checkout(req.user?.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.orders.myOrders(userId);
  }

  @Get('mine/:id')
  myOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.orders.myOrder(userId, id);
  }

  @Public()
  @Get('track')
  track(@Query('orderNumber') orderNumber: string, @Query('email') email: string) {
    return this.orders.byNumberPublic(orderNumber, email);
  }

  @Public()
  @Get('confirmation/:id')
  confirmation(@Param('id') id: string, @Query('email') email: string | undefined, @Req() req: any) {
    return this.orders.confirmation(id, req.user?.id, email);
  }
}
