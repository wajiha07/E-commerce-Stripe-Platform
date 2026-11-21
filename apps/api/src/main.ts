import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  app.use('/api/payments/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '2mb' }));
  app.use(cookieParser(config.get<string>('COOKIE_SECRET')));
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN') || 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`LUNAIRE API listening on http://localhost:${port}/api`);
}

bootstrap();
