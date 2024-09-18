import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { User } from 'src/auth/entities/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { Notification } from 'src/notification/entities/notification.entity';
import { Task } from 'src/task/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      UserRoom,
      User,
      LoginSession,
      Notification,
      Task,
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService, NotificationService],
})
export class RoomModule {}
