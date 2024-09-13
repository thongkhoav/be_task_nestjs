import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Put,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { AssignTaskDTO } from './dto/assign-task.dto';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    await this.taskService.createTaskValidator(createTaskDto);
    await this.taskService.createTask(createTaskDto);
    return { message: 'Task created' };
  }

  @Get(':roomId')
  async getRoomTasks(@Param('roomId') roomId: string) {
    const data = await this.taskService.getAllTasksOfRoom(roomId);
    return { data };
  }

  @Get(':roomId/:userId')
  async getRoomUserTasks(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    const data = await this.taskService.getTasksOfRoomUser(roomId, userId);
    return { data };
  }

  @Patch('update-status')
  async updateStatus(@Body() updateTaskDto: UpdateStatusTaskDTO, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new Error('User not found');
    }
    await this.taskService.updateStatusTaskValidator(curUserId, updateTaskDto);
    await this.taskService.updateStatusTask(updateTaskDto);
    return { message: 'Task status updated' };
  }

  @Put('assign')
  @HttpCode(HttpStatus.OK)
  async assignTask(@Body() assignTaskDto: AssignTaskDTO, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new Error('User not found');
    }
    await this.taskService.assignTaskValidator(
      curUserId,
      assignTaskDto.taskId,
      assignTaskDto.userId,
    );
    await this.taskService.assignTask(assignTaskDto.taskId, curUserId);
    return { message: 'Task assigned' };
  }
}
