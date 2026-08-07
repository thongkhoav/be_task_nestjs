import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TaskService } from '../task/task.service';
import { UpdateStatusTaskDTO } from '../task/dto/update-task-status.dto';
import { Task, TaskStatus } from '../task/entities/task.entity';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocketSecurityService } from './socket-security.service';
import { socketCors } from './socket-cors';

@Injectable()
@WebSocketGateway({
  cors: socketCors,
})
export class TaskGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly taskService: TaskService,
    private eventEmitter: EventEmitter2,
    private readonly socketSecurity: SocketSecurityService,
  ) {}

  afterInit(server: Server) {
    this.socketSecurity.install(server);
  }

  handleConnection(_client: Socket) {}

  onModuleInit() {
    this.eventEmitter.on('task.updated', (task: Task) => {
      this.server.to(task.room.id).emit('task_updated', task);
    });
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await this.socketSecurity.assertRoomMember(client, roomId);
    await client.join(roomId);
  }

  @SubscribeMessage('update_task')
  async handleTaskUpdate(
    @MessageBody() data: { taskId: string; status: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data.taskId ||
      !data.status ||
      !Object.values(TaskStatus).includes(data.status as TaskStatus)
    ) {
      throw new WsException('Invalid data provided');
    }

    const userId = this.socketSecurity.getUserId(client);
    const update = {
      taskId: data.taskId,
      status: data.status as UpdateStatusTaskDTO['status'],
    };
    await this.taskService.updateStatusTaskValidator(userId, update);
    const updated = await this.taskService.updateStatusTask(userId, update);
    this.server.to(updated.room.id).emit('task_updated', updated);
  }

  emitTaskUpdatedToRoom(roomId: string, task: Task) {
    this.server.to(roomId).emit('task_updated', task);
  }
}
