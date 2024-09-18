import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
// get .env variables
import { config } from 'dotenv';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { TaskModule } from './task/task.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import * as admin from 'firebase-admin';

config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    RoomModule,
    TaskModule,
    UserModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
export class AppModule {
  constructor() {}
}
