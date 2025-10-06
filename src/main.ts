import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 phút
      max: 100, // Giới hạn 100 yêu cầu mỗi IP mỗi phút
    }),
  );
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://accounts.google.com/o/oauth2/v2/auth',
      configService.get<string>('FE_HOST') || process.env.FE_HOST,
    ],
    credentials: true,
  });

  console.log('CORS ORIGIN: ', [
    'http://localhost:3000',
    configService.get<string>('FE_HOST') || process.env.FE_HOST,
  ]);

  const config = new DocumentBuilder()
    .setTitle('Task app')
    .setDescription('The task app API description')
    .setVersion('1.0')
    .addTag('tasks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(
    configService.get<number>('PORT') || process.env.PORT || 3333,
    '0.0.0.0',
  );
}
bootstrap();
