import { Controller, Get } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('shipping')
export class ShippingController {
  constructor(private shipping: ShippingService) {}

  @Public()
  @Get('methods')
  methods() {
    return this.shipping.listPublic();
  }
}
