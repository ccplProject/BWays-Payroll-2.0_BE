import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { __BE_PORT, __BE_OPEN_TO } from './config/config.config';
import { applySafeTypeOrmPatch } from './database/safe_query_interceptor';

applySafeTypeOrmPatch();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
  await app.listen(__BE_PORT, __BE_OPEN_TO);
  console.log(`Application is running on: http://${__BE_OPEN_TO}:${__BE_PORT}`);
}
bootstrap();
