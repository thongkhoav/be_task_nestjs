import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class AssignTaskDTO {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
