import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import { parseFrontendOrigins } from './common/util/frontendOrigins';
import { resolvePort } from './common/util/port';

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
  const frontendOrigins = parseFrontendOrigins(
    configService.get<string>('FE_ORIGINS') || process.env.FE_ORIGINS,
  );
  const corsOrigins = [
    ...new Set(['http://localhost:3000', ...frontendOrigins]),
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  console.log('CORS ORIGIN: ', corsOrigins);

  const config = new DocumentBuilder()
    .setTitle('Task app')
    .setDescription('The task app API description')
    .setVersion('1.0')
    .addTag('tasks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = resolvePort(configService.get<string>('PORT'), 3333);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
