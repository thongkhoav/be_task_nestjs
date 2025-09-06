import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
// get .env variables
import { config } from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { RoomModule } from './room/room.module';
import { TaskModule } from './task/task.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { NotificationModule } from './notification/notification.module';
import * as admin from 'firebase-admin';
import { SocketModule } from './socket/socket.module';
import { EventsModule } from './socket/events.module';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from './mail/mail.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';

config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: +config.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    DatabaseModule,
    AuthModule,
    RoomModule,
    TaskModule,
    SocketModule,
    EventsModule,
    NotificationModule,
    ChatModule,
    UserModule,
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
