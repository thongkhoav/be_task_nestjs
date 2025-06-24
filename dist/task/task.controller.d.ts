import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { AssignTaskDTO } from './dto/assign-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TaskController {
    private readonly taskService;
    constructor(taskService: TaskService);
    create(createTaskDto: CreateTaskDto): Promise<{
        message: string;
    }>;
    updateTaskInfo(taskId: string, dto: UpdateTaskDto): Promise<{
        message: string;
    }>;
    getRoomUserTasks(roomId: string, userId: string): Promise<{
        data: any[];
    }>;
    updateStatus(updateStatusDto: UpdateStatusTaskDTO, req: any): Promise<{
        message: string;
    }>;
    assignTask(assignTaskDto: AssignTaskDTO, req: any): Promise<{
        message: string;
    }>;
}
