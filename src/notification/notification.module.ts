import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { firebaseAdminProvider } from './firebaseAdminProvider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { Notification } from './entities/notification.entity';
import { NotificationQueue } from 'src/queues/notification.queue';
import { NotificationProcessor } from 'src/processors/notification.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LoginSession, Notification]),
    BullModule.registerQueue(
      {
        name: 'task-deadline',
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT, 10),
        },
      },
      // {
      //   name: 'task-test',
      //   connection: {
      //     host: process.env.REDIS_HOST,
      //     port: parseInt(process.env.REDIS_PORT, 10),
      //   },
      // },
    ),
  ],
  controllers: [NotificationController],
  providers: [
    firebaseAdminProvider,
    NotificationService,
    NotificationQueue,
    NotificationProcessor,
  ],
  exports: [NotificationService, NotificationQueue],
})
export class NotificationModule {}
