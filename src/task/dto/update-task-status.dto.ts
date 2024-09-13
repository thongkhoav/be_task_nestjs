import { IsNotEmpty, IsString } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateStatusTaskDTO {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsNotEmpty()
  @IsString()
  status: TaskStatus;
}
