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
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { AssignTaskDTO } from './dto/assign-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller({
  version: '1',
  path: 'task',
})
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    await this.taskService.createTaskValidator(createTaskDto);
    await this.taskService.createTask(createTaskDto);
    return { message: 'Task created' };
  }

  @Patch(':taskId/update-task-info')
  async updateTaskInfo(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    await this.taskService.updateTaskValidator(taskId, dto);
    await this.taskService.updateTask(taskId, dto);
    return { message: 'Task updated' };
  }

  @Get('room/:roomId')
  async getRoomUserTasks(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
  ) {
    const data = await this.taskService.getTasksOfRoom(roomId, userId);
    return { data };
  }

  @Patch('update-status')
  async updateStatus(@Body() updateStatusDto: UpdateStatusTaskDTO, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new Error('User not found');
    }
    await this.taskService.updateStatusTaskValidator(
      curUserId,
      updateStatusDto,
    );
    await this.taskService.updateStatusTask(curUserId, updateStatusDto);
    return { message: 'Task status updated' };
  }

  // @Get(':roomId')
  // async getRoomTasks(@Param('roomId') roomId: string) {
  //   const data = await this.taskService.getAllTasksOfRoom(roomId);
  //   return { data };
  // }

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
