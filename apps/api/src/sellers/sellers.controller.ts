import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SellersService } from './sellers.service';
import { RegisterSellerDto, UpdateSellerDto } from './dto/seller.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('sellers')
export class SellersController {
  constructor(private sellers: SellersService) {}

  @Post('register')
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterSellerDto) {
    return this.sellers.register(userId, dto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  me(@CurrentUser('id') userId: string) {
    return this.sellers.me(userId);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateSellerDto) {
    return this.sellers.updateMe(userId, dto);
  }

  @Post('me/onboard')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  onboard(@CurrentUser('id') userId: string) {
    return this.sellers.createOnboardingLink(userId);
  }

  @Post('me/refresh')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  refresh(@CurrentUser('id') userId: string) {
    return this.sellers.refreshStripeStatus(userId);
  }

  @Public()
  @Get('store/:slug')
  store(@Param('slug') slug: string) {
    return this.sellers.bySlug(slug);
  }
}
