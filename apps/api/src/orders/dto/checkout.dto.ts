import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  shippingName!: string;

  @IsString()
  shippingLine1!: string;

  @IsOptional()
  @IsString()
  shippingLine2?: string;

  @IsString()
  shippingCity!: string;

  @IsOptional()
  @IsString()
  shippingState?: string;

  @IsString()
  shippingPostal!: string;

  @IsString()
  shippingCountry!: string;

  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @IsString()
  shippingMethodId!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  fulfillmentStatus?: string;
}
