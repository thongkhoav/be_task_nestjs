import { Module } from '@nestjs/common';
import { TaskGateway } from './task.gateway';
import { TaskService } from 'src/task/task.service';
import { TaskModule } from 'src/task/task.module';
import { ChatGateway } from './chat.gateway';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  providers: [TaskGateway, ChatGateway],
  exports: [TaskGateway, ChatGateway],
  imports: [TaskModule, ChatModule],
})
export class SocketModule {}
