import { Controller, Get } from '@nestjs/common';
import { CmsService } from './cms.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('cms')
export class CmsController {
  constructor(private cms: CmsService) {}

  @Public()
  @Get('banners')
  banners() {
    return this.cms.banners();
  }
}
