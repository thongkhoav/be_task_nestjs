import { Server, Socket } from 'socket.io';
import { TaskService } from './task/task.service';
import { Task } from './task/entities/task.entity';
export declare class TaskGateway {
    private readonly taskService;
    server: Server;
    constructor(taskService: TaskService);
    handleJoinRoom(roomId: string, client: Socket): void;
    handleTaskUpdate(data: {
        taskId: string;
        status: string;
        curUserId: string;
    }): Promise<void>;
    emitTaskUpdatedToRoom(roomId: string, task: Task): void;
}
