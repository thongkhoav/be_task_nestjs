import { Module } from '@nestjs/common';
import { TaskGateway } from './task.gateway';
import { TaskService } from 'src/task/task.service';
import { TaskModule } from 'src/task/task.module';
import { ChatGateway } from './chat.gateway';
import { ChatModule } from 'src/chat/chat.module';
import { AuthModule } from 'src/auth/auth.module';
import { RoomModule } from 'src/room/room.module';
import { SocketSecurityService } from './socket-security.service';

@Module({
  providers: [TaskGateway, ChatGateway, SocketSecurityService],
  exports: [TaskGateway, ChatGateway],
  imports: [TaskModule, ChatModule, AuthModule, RoomModule],
})
export class SocketModule {}
