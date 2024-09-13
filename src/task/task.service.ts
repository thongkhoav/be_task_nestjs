import { Inject, Injectable } from '@nestjs/common';
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
      throw new Error('Task not found');
    }

    // check current user is owner of the room
    const userRoom = await this.userRoomRepository.findOne({
      where: { user: { id: ownerId }, room: { id: task.room.id } },
    });

    if (!userRoom.isOwner) {
      throw new Error('You are not allowed to assign task');
    }

    // check if user is in the room
    const userRoomAssign = await this.userRoomRepository.findOne({
      where: { user: { id: userId }, room: { id: task.room.id } },
    });

    if (!userRoomAssign) {
      throw new Error('User is not in the room');
    }
  }

  async assignTask(taskId: string, userId: string): Promise<void> {
    await this.taskRepository.update({ id: taskId }, { user: { id: userId } });
  }

  async getAllTasksOfRoom(roomId: string): Promise<any[]> {
    const tasks = await this.taskRepository.find({
      where: { id: roomId },
      relations: ['user'], // Load related user with the task
    });
    return tasks;
  }

  async getTasksOfRoomUser(roomId: string, userId: string): Promise<any[]> {
    return await this.taskRepository.find({
      where: { room: { id: roomId }, user: { id: userId } },
    });
  }

  async createTaskValidator(task: CreateTaskDto): Promise<void> {
    // check if dueDate is valid
    if (task.dueDate < new Date()) {
      throw new Error('Due date is invalid');
    }

    // check if room exists
    const room = await this.roomRepository.findOne({
      where: { id: task.roomId },
    });
    if (!room) {
      throw new Error('Room not found');
    }

    // check if user exists
    if (task.userId) {
      const user = await this.userRepository.findOne({
        where: { id: task.userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      // check if user is in the room
      const userRoom = await this.userRoomRepository.findOne({
        where: { user: { id: user.id }, room: { id: room.id } },
      });
      if (!userRoom) {
        throw new Error('User is not in the room');
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
    await this.taskRepository.save(task);
    console.log('Task created');
    return true;
  }

  async updateTask(taskId: string, task: UpdateTaskDto): Promise<void> {
    const existTask = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!existTask) {
      throw new Error('Task not found');
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
  }

  async deleteTask(id: string): Promise<void> {
    const existTask = await this.taskRepository.findOne({
      where: { id: id },
    });

    if (!existTask) {
      throw new Error('Task not found');
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
    });

    if (!existTask) {
      throw new Error('Task not found');
    }

    // check if status is valid
    if (!Object.values(TaskStatus).includes(task.status)) {
      throw new Error('Status is invalid');
    }

    const userRoom = await this.userRoomRepository.findOne({
      where: { user: { id: userId }, room: { id: existTask.room.id } },
    });
    // owner or assignee can update status
    if (!(userRoom.isOwner && existTask.user.id === userId)) {
      throw new Error('You are not allowed to update status');
    }
  }

  async updateStatusTask(task: UpdateStatusTaskDTO): Promise<void> {
    await this.taskRepository.update(
      { id: task.taskId },
      { status: task.status },
    );
  }
}
