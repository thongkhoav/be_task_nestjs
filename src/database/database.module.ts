import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('DB_HOST'),
        port: config.getOrThrow('DB_PORT'),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        // set ssl false in development, true in production
        ssl:
          config.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        // Optionally, you can add more TypeORM options here
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
