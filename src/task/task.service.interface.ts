import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface TaskServiceInterface {
  getAllTasksOfRoom(roomId: string): Promise<any[]>; // string for GUIDs
  getTasksOfRoom(roomId: string, userId: string): Promise<any[]>;

  createTaskValidator(task: CreateTaskDto): Promise<void>;
  createTask(task: CreateTaskDto): Promise<boolean>;

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
  updateStatusTask(task: UpdateStatusTaskDTO): Promise<void>;
}
