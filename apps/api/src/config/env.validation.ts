import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV!: string;

  @IsString()
  @MinLength(10)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  PORT?: number;

  @IsString()
  WEB_ORIGIN!: string;

  @IsString()
  @MinLength(32)
  COOKIE_SECRET!: string;

  @IsString()
  STRIPE_SECRET_KEY!: string;

  @IsString()
  STRIPE_PUBLISHABLE_KEY!: string;

  @IsString()
  STRIPE_WEBHOOK_SECRET!: string;

  @IsOptional()
  @IsString()
  PLATFORM_FEE_PERCENT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  if (validated.NODE_ENV === 'production') {
    const secrets = [
      validated.JWT_ACCESS_SECRET,
      validated.JWT_REFRESH_SECRET,
      validated.COOKIE_SECRET,
    ];
    if (secrets.some((v) => /placeholder|change-me|lunaire-dev/i.test(v))) {
      throw new Error('Production requires non-dev JWT/cookie secrets (≥32 chars)');
    }
    if (/placeholder/i.test(validated.STRIPE_SECRET_KEY)) {
      throw new Error('Production requires a real Stripe secret key (sk_test_… or sk_live_…)');
    }
  }

  return validated;
}
