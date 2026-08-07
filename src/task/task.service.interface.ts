import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

export interface TaskServiceInterface {
  getAllTasksOfRoom(roomId: string): Promise<any[]>; // string for GUIDs
  getTasksOfRoom(
    requesterId: string,
    roomId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]>;

  createTaskValidator(requesterId: string, task: CreateTaskDto): Promise<void>;
  createTask(task: CreateTaskDto): Promise<boolean>;

  updateTaskValidator(
    requesterId: string,
    taskId: string,
    task: UpdateTaskDto,
  ): Promise<void>;
  updateTask(taskId: string, task: UpdateTaskDto): Promise<void>;

  deleteTask(id: string): Promise<void>;

  assignTaskValidator(
    ownerId: string,
    taskId: string,
    userId: string,
  ): Promise<void>;
  assignTask(taskId: string, userId: string): Promise<void>;

  updateStatusTaskValidator(
    userId: string,
    task: UpdateStatusTaskDTO,
  ): Promise<void>;

  updateStatusTask(curUserId: string, task: UpdateStatusTaskDTO): Promise<Task>;
}
