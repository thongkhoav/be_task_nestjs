import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskServiceInterface } from './task.service.interface';
import { UpdateStatusTaskDTO } from './dto/update-task-status.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { User } from 'src/auth/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class TaskService implements TaskServiceInterface {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private userRoomRepository: Repository<UserRoom>,
    private notificationService: NotificationService,
  ) {}

  // Only owner can assign task
  async assignTaskValidator(
    ownerId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    // check if task exists
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // check current user is owner of the room
    const userRoom = await this.userRoomRepository.findOne({
      where: { user: { id: ownerId }, room: { id: task.room.id } },
    });

    if (!userRoom.isOwner) {
      throw new UnauthorizedException('You are not allowed to assign task');
    }

    // check if user is in the room
    const userRoomAssign = await this.userRoomRepository.findOne({
      where: { user: { id: userId }, room: { id: task.room.id } },
    });

    if (!userRoomAssign) {
      throw new BadRequestException('User is not in the room');
    }
  }

  async assignTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['room'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.taskRepository.update({ id: taskId }, { user: { id: userId } });

    await this.notificationService.sendNotificationAndSave(
      userId,
      'Assigned to task',
      `Assigned to task "${taskId}" in room "${task.room.name}"`,
    );
  }

  async getAllTasksOfRoom(roomId: string): Promise<any[]> {
    const tasks = await this.taskRepository.find({
      where: { id: roomId },
      relations: ['user'], // Load related user with the task
    });
    return tasks;
  }

  async getTasksOfRoom(roomId: string, userId: string): Promise<any[]> {
    let tasks;
    let whereOption: any = { room: { id: roomId } };
    if (userId) {
      whereOption = { ...whereOption, user: { id: userId } };
    }
    tasks = await this.taskRepository.find({
      where: whereOption,
      relations: ['user'],
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        review: true,
        user: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });
    console.log('room tasks', tasks);
    return tasks;
  }

  async createTaskValidator(task: CreateTaskDto): Promise<void> {
    // check if dueDate is valid
    if (task.dueDate < new Date()) {
      throw new BadRequestException('Due date is invalid');
    }

    // check if room exists
    const room = await this.roomRepository.findOne({
      where: { id: task.roomId },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // check if user exists
    if (task.userId) {
      const user = await this.userRepository.findOne({
        where: { id: task.userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // check if user is in the room
      const userRoom = await this.userRoomRepository.findOne({
        where: { user: { id: user.id }, room: { id: room.id } },
      });
      if (!userRoom) {
        throw new BadRequestException('User is not in the room');
      }
    }
  }

  async createTask(task: CreateTaskDto): Promise<boolean> {
    const newTask = new Task({});
    newTask.title = task.title;
    newTask.description = task.description;
    newTask.dueDate = task.dueDate;
    newTask.status = TaskStatus.TODO;

    if (task.userId) {
      const assignUser = await this.userRepository.findOne({
        where: { id: task.userId },
      });
      if (assignUser) {
        newTask.user = assignUser;
      }
    }

    const room = await this.roomRepository.findOne({
      where: { id: task.roomId },
    });
    if (room) {
      newTask.room = room;
    }
    console.log(newTask);

    await this.taskRepository.save(newTask);
    console.log('Task created');
    return true;
  }

  async updateTaskValidator(
    taskId: string,
    task: UpdateTaskDto,
  ): Promise<void> {
    // check if dueDate is valid
    if (task.dueDate < new Date()) {
      throw new BadRequestException('Due date is invalid');
    }

    // check if task exists
    const existTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['room', 'user'],
    });
    if (!existTask) {
      throw new NotFoundException('Task not found');
    }

    // check if user exists
    if (task.userId) {
      const user = await this.userRepository.findOne({
        where: { id: task.userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // check if user is in the room
      const userRoom = await this.userRoomRepository.findOne({
        where: { user: { id: user.id }, room: { id: existTask.room.id } },
      });
      if (!userRoom) {
        throw new BadRequestException('User is not in the room');
      }
    }
  }

  async updateTask(taskId: string, task: UpdateTaskDto): Promise<void> {
    const existTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['room'],
    });

    if (!existTask) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.update(
      { id: taskId },
      {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        user: { id: task.userId },
      },
    );
    if (existTask.user.id !== task.userId) {
      await this.notificationService.sendNotificationAndSave(
        task.userId,
        'Assigned to task',
        `Assigned to task ${existTask.title} in room ${existTask.room.name}`,
      );
    }
  }

  async deleteTask(id: string): Promise<void> {
    const existTask = await this.taskRepository.findOne({
      where: { id: id },
    });

    if (!existTask) {
      throw new NotFoundException('Task not found');
    }

    // soft delete
    await this.taskRepository.softDelete({ id });
  }

  async updateStatusTaskValidator(
    userId: string,
    task: UpdateStatusTaskDTO,
  ): Promise<void> {
    // check if task exists
    const existTask = await this.taskRepository.findOne({
      where: { id: task.taskId },
      relations: ['room', 'user'],
    });

    if (!existTask) {
      throw new NotFoundException('Task not found');
    }

    // check if status is valid
    if (!Object.values(TaskStatus).includes(task.status)) {
      throw new BadRequestException('Status is invalid');
    }
    // console.log('existTask', existTask);

    const userRoom = await this.userRoomRepository.findOne({
      where: { user: { id: userId }, room: { id: existTask.room.id } },
    });
    // console.log('userRoom', {
    //   user: { id: userId },
    //   existTask,
    //   userRoom,
    // });

    // owner or assignee can update status
    if (!userRoom.isOwner && !(existTask.user.id === userId)) {
      throw new UnauthorizedException('You are not allowed to update status');
    }
  }

  async updateStatusTask(
    curUserId: string,
    task: UpdateStatusTaskDTO,
  ): Promise<void> {
    await this.taskRepository.update(
      { id: task.taskId },
      { status: task.status },
    );
    // notify to room owner
    const taskDb = await this.taskRepository.findOne({
      where: { id: task.taskId },
      relations: ['room'],
    });
    const roomOwner = await this.userRoomRepository.findOne({
      where: { room: { id: taskDb.room.id }, isOwner: true },
      relations: ['user'],
    });

    // memmber update status to DONE -> notify to owner
    if (curUserId !== roomOwner.user.id && task.status === TaskStatus.DONE) {
      await this.notificationService.sendNotificationAndSave(
        roomOwner.user.id,
        'Task completed',
        `Task "${taskDb.title}" in room "${taskDb.room.name}" is DONE`,
      );
    }
  }
}
