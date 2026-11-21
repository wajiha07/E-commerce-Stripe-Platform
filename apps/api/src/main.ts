import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import { join } from 'path';
import { AppModule, WEB_DIST_PATH } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { json, raw } from 'express';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use('/api/payments/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '1mb' }));
  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProd
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              scriptSrc: ["'self'", 'https://js.stripe.com'],
              frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
              connectSrc: ["'self'", 'https://api.stripe.com'],
            },
          }
        : false,
    }),
  );

  const webOrigin = config.getOrThrow<string>('WEB_ORIGIN');
  app.enableCors({
    origin: webOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'x-request-id'],
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
  app.enableShutdownHooks();

  await app.init();

  // After Nest routes/static: SPA fallback for React Router
  if (WEB_DIST_PATH) {
    const indexHtml = join(WEB_DIST_PATH, 'index.html');
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(/^(?!\/api).*/, (req: any, res: any, next: any) => {
      if (req.path.includes('.')) return next();
      res.sendFile(indexHtml, (err: Error) => (err ? next(err) : undefined));
    });
    logger.log(`Serving SPA from ${WEB_DIST_PATH}`);
  }

  const port = Number(process.env.PORT) || config.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`LUNAIRE API listening on port ${port} (${process.env.NODE_ENV || 'development'})`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
