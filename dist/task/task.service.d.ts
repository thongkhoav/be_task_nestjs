import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskServiceInterface } from './task.service.interface';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from 'src/auth/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { NotificationService } from 'src/notification/notification.service';
export declare class TaskService implements TaskServiceInterface {
    private taskRepository;
    private userRepository;
    private roomRepository;
    private userRoomRepository;
    private notificationService;
    constructor(taskRepository: Repository<Task>, userRepository: Repository<User>, roomRepository: Repository<Room>, userRoomRepository: Repository<UserRoom>, notificationService: NotificationService);
    assignTaskValidator(ownerId: string, taskId: string, userId: string): Promise<void>;
    assignTask(taskId: string, userId: string): Promise<void>;
    getAllTasksOfRoom(roomId: string): Promise<any[]>;
    getTasksOfRoom(roomId: string, userId: string): Promise<any[]>;
    createTaskValidator(task: CreateTaskDto): Promise<void>;
    createTask(task: CreateTaskDto): Promise<boolean>;
    updateTaskValidator(taskId: string, task: UpdateTaskDto): Promise<void>;
    updateTask(taskId: string, task: UpdateTaskDto): Promise<void>;
    deleteTask(id: string): Promise<void>;
    updateStatusTaskValidator(userId: string, task: UpdateStatusTaskDTO): Promise<void>;
    updateStatusTask(curUserId: string, task: UpdateStatusTaskDTO): Promise<Task>;
}
