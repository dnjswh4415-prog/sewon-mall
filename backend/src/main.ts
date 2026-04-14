import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(5000);
  console.log('Server running on http://localhost:5000/api');
}
bootstrap();