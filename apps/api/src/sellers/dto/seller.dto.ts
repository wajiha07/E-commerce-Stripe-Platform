import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterSellerDto {
  @IsString()
  @MinLength(2)
  storeName!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSellerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  storeName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
