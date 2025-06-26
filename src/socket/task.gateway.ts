import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TaskService } from '../task/task.service';
import { UpdateStatusTaskDTO } from '../task/dto/update-task-status.dto';
import { Task, TaskStatus } from '../task/entities/task.entity';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TaskGateway implements OnModuleInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly taskService: TaskService,
    private eventEmitter: EventEmitter2,
  ) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  onModuleInit() {
    this.eventEmitter.on('task.updated', (task: Task) => {
      console.log(`Task updated event-emitter: ${task.id}`);
      this.server.to(task.room.id).emit('task_updated', task);
    });
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('update_task')
  async handleTaskUpdate(
    @MessageBody() data: { taskId: string; status: string; curUserId: string },
  ) {
    console.log('socket update_task', data);
    if (
      !data.curUserId ||
      !data.taskId ||
      !data.status ||
      !Object.values(TaskStatus).includes(data.status as TaskStatus)
    ) {
      throw new Error('Invalid data provided');
    }

    // Validate the task status update
    const updated = await this.taskService.updateStatusTask(data.curUserId, {
      taskId: data.taskId,
      status: data.status as UpdateStatusTaskDTO['status'],
    });
    this.server.to(updated.room.id).emit('task_updated', updated);
  }

  emitTaskUpdatedToRoom(roomId: string, task: Task) {
    this.server.to(roomId).emit('task_updated', task);
  }
}
