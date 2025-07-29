import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { NotificationQueue } from 'src/queues/notification.queue';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
