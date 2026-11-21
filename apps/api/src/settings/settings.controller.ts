import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Public()
  @Get('public')
  publicSettings() {
    return this.settings.getPublic();
  }
}
