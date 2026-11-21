import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Public()
  @Post('webhook')
  webhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.payments.handleWebhook(req.body, signature);
  }

  /** Development-only: confirm mock payment without Stripe CLI */
  @Public()
  @Post('mock-confirm')
  mockConfirm(@Body() body: { orderId: string; secret?: string }) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException();
    }
    return this.payments.mockConfirm(body.orderId);
  }
}
