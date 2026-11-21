import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  guestId?: string;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  guestId?: string;
}

export class GuestQueryDto {
  @IsOptional()
  @IsString()
  guestId?: string;
}
