import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Diperlukan agar req.ip akurat (bukan IP Nginx) saat deploy di belakang
  // reverse proxy -- dipakai oleh WebhookIpWhitelistGuard. Aman diaktifkan
  // selalu karena Nginx di docker-compose.yml sudah menimpa header ini.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // HTTP security headers (HSTS, X-Frame-Options, noSniff, dll).
  // CSP dimatikan karena API ini menyajikan Swagger UI (CSP default helmet
  // memblokir aset inline Swagger). Endpoint API murni data JSON, jadi tidak
  // butuh CSP; proteksi header lain tetap aktif.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ISP Billing & Payment System API')
    .setDescription('REST API untuk sistem penagihan dan pembayaran pelanggan internet')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`ISP Billing API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
