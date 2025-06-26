import { Module } from '@nestjs/common';
import { TaskGateway } from './task.gateway';
import { TaskService } from 'src/task/task.service';
import { TaskModule } from 'src/task/task.module';

@Module({
  providers: [TaskGateway],
  exports: [TaskGateway],
  imports: [TaskModule],
})
export class SocketModule {}
