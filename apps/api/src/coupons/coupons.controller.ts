import { Body, Controller, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Public } from '../common/decorators/public.decorator';
import { IsNumber, IsString } from 'class-validator';

class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsNumber()
  subtotal!: number;
}

@Controller('coupons')
export class CouponsController {
  constructor(private coupons: CouponsService) {}

  @Public()
  @Post('validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto.code, dto.subtotal);
  }
}
