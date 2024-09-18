import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { Task } from './entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/auth/entities/user.entity';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { NotificationService } from 'src/notification/notification.service';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Room,
      User,
      UserRoom,
      LoginSession,
      Notification,
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService, NotificationService],
})
export class TaskModule {}
