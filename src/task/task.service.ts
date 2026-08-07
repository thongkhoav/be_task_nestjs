import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationQueue } from 'src/queues/notification.queue';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { delayMsCalculator } from 'src/common/util/taskSchedule';
import { ConfigService } from '@nestjs/config';

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
    @InjectRepository(LoginSession)
    private loginSessionRepository: Repository<LoginSession>,
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter2,
    private notificationQueue: NotificationQueue,
    private config: ConfigService,
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
      relations: ['room'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (!task.room) {
      throw new NotFoundException('Task room not found');
    }

    // check current user is owner of the room
    const userRoom = await this.userRoomRepository.findOne({
      where: { user: { id: ownerId }, room: { id: task.room.id } },
    });

    if (!userRoom?.isOwner) {
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

    // notify to assigned user
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

  async getTasksOfRoom(
    requesterId: string,
    roomId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    await this.assertRoomMember(requesterId, roomId);

    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .where('task.roomId = :roomId', { roomId });
    if (userId) {
      query.andWhere('task.userId = :userId', { userId });
    }
    if (startDate) {
      query.andWhere('task.dueDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('task.dueDate <= :endDate', { endDate });
    }
    query.orderBy('task.dueDate', 'ASC');
    const tasks = await query.getMany();

    return tasks;
  }

  async createTaskValidator(
    requesterId: string,
    task: CreateTaskDto,
  ): Promise<void> {
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
    await this.assertRoomMember(requesterId, room.id);

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
    // save task and get task
    const taskCreated = await this.taskRepository.save(newTask);
    if (task.userId) {
      await this.notificationService.sendNotificationAndSave(
        task.userId,
        'Assigned to task',
        `Assigned to task ${newTask.title} in room ${newTask.room.name}`,
      );
      const fcmTokens = await this.loginSessionRepository.find({
        where: { user: { id: task.userId } },
        relations: ['user'],
      });
      const reminderBeforeDeadline =
        this.config.get<number>('TASK_REMINDER_BEFORE_DEADLINE') || 30;
      const delayMs = delayMsCalculator(task.dueDate, reminderBeforeDeadline);
      if (fcmTokens.length > 0 && delayMs > 0) {
        fcmTokens.forEach((token) => {
          this.notificationQueue.scheduleReminder(
            taskCreated.id,
            task.userId,
            token.fcmToken,
            task.title,
            room.name,
            token.user.email,
            delayMs,
          );
        });
      }
    }
    return true;
  }

  async updateTaskValidator(
    requesterId: string,
    taskId: string,
    task: UpdateTaskDto,
  ): Promise<void> {
    //  Updated: User can change task info without changing due date
    // check if dueDate is valid
    // if (task.dueDate < new Date()) {
    //   throw new BadRequestException('Due date is invalid');
    // }

    // check if task exists
    const existTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['room', 'user'],
    });
    if (!existTask) {
      throw new NotFoundException('Task not found');
    }
    await this.assertRoomMember(requesterId, existTask.room.id);

    // check if user exists
    if (task?.userId) {
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
    let existTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['room', 'user'],
    });

    if (!existTask) {
      throw new NotFoundException('Task not found');
    }

    if (task?.userId) {
      await this.taskRepository.update(
        { id: taskId },
        {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          user: { id: task.userId },
        },
      );
      if (
        existTask?.user?.id !== task.userId ||
        task.dueDate !== existTask.dueDate
      ) {
        let notifyUserId;
        if (existTask?.user?.id !== task.userId) {
          notifyUserId = task.userId;
        } else if (task.dueDate !== existTask.dueDate) {
          notifyUserId = existTask?.user?.id;
        }

        await this.notificationService.sendNotificationAndSave(
          notifyUserId,
          'Assigned to task',
          `Assigned to task ${existTask.title} in room ${existTask.room.name}`,
        );

        // remove all schedule jobs of this task
        await this.notificationQueue.removeScheduleJobs(taskId);
        const fcmTokens = await this.loginSessionRepository.find({
          where: { user: { id: notifyUserId } },
          relations: ['user'],
        });
        const reminderBeforeDeadline =
          this.config.get<number>('TASK_REMINDER_BEFORE_DEADLINE') || 30;
        const delayMs = delayMsCalculator(task.dueDate, reminderBeforeDeadline);
        if (fcmTokens.length > 0 && delayMs > 0) {
          // If user allowed to receive notifications, schedule reminder
          fcmTokens.forEach((token) => {
            this.notificationQueue.scheduleReminder(
              taskId,
              notifyUserId,
              token.fcmToken,
              task.title,
              existTask.room.name,
              token.user.email,
              delayMs,
            );
          });
        }
      }
    } else {
      await this.taskRepository.update(
        { id: taskId },
        {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          user: null,
        },
      );
      if (existTask?.user) {
        // remove all schedule jobs of this task
        await this.notificationQueue.removeScheduleJobs(taskId);
      }
    }
    existTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['room', 'user'],
    });

    // call event emitter, then emit to socket
    this.eventEmitter.emit('task.updated', existTask);
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
    if (!userRoom || (!userRoom.isOwner && existTask.user?.id !== userId)) {
      throw new UnauthorizedException('You are not allowed to update status');
    }
  }

  async updateStatusTask(
    curUserId: string,
    task: UpdateStatusTaskDTO,
  ): Promise<Task> {
    // check if task exists
    const taskDb = await this.taskRepository.findOne({
      where: { id: task.taskId },
      relations: ['room', 'user'],
    });
    if (!taskDb) {
      throw new NotFoundException('Task not found');
    }

    // notify to room owner
    const roomOwner = await this.userRoomRepository.findOne({
      where: { room: { id: taskDb.room.id }, isOwner: true },
      relations: ['user'],
    });
    if (!roomOwner?.user) {
      throw new NotFoundException('Room owner not found');
    }

    taskDb.status = task.status;
    await this.taskRepository.save(taskDb);

    // memmber update status to DONE -> notify to owner
    if (curUserId !== roomOwner.user.id && task.status === TaskStatus.DONE) {
      await this.notificationService.sendNotificationAndSave(
        roomOwner.user.id,
        'Task completed',
        `Task "${taskDb.title}" in room "${taskDb.room.name}" is DONE`,
      );
    }
    // console.log('taskDb', taskDb);

    return taskDb;
  }

  private async assertRoomMember(
    userId: string,
    roomId: string,
  ): Promise<void> {
    const membership = await this.userRoomRepository.findOne({
      where: { user: { id: userId }, room: { id: roomId } },
    });
    if (!membership) {
      throw new UnauthorizedException('You are not a member of this room');
    }
  }
}
