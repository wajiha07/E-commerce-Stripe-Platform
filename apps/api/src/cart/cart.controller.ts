import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Public } from '../common/decorators/public.decorator';
import { AddCartItemDto, GuestQueryDto, UpdateCartItemDto } from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private cart: CartService) {}

  private userId(req: any): string | undefined {
    return req.user?.id;
  }

  @Public()
  @Get()
  get(@Req() req: any, @Query() query: GuestQueryDto) {
    return this.cart.getOrCreate(this.userId(req), query.guestId);
  }

  @Public()
  @Post('items')
  add(@Req() req: any, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(this.userId(req), dto.guestId, dto.variantId, dto.quantity);
  }

  @Public()
  @Patch('items/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(this.userId(req), dto.guestId, id, dto.quantity);
  }

  @Public()
  @Delete('items/:id')
  remove(@Req() req: any, @Param('id') id: string, @Query() query: GuestQueryDto) {
    return this.cart.removeItem(this.userId(req), query.guestId, id);
  }

  @Post('merge')
  merge(@Req() req: any, @Body() body: { guestId: string }) {
    return this.cart.mergeGuestCart(req.user.id, body.guestId);
  }
}
