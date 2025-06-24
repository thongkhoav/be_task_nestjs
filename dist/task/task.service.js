"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const task_entity_1 = require("./entities/task.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const room_entity_1 = require("../room/entities/room.entity");
const user_room_entity_1 = require("../auth/entities/user-room.entity");
const notification_service_1 = require("../notification/notification.service");
let TaskService = class TaskService {
    constructor(taskRepository, userRepository, roomRepository, userRoomRepository, notificationService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.userRoomRepository = userRoomRepository;
        this.notificationService = notificationService;
    }
    async assignTaskValidator(ownerId, taskId, userId) {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        const userRoom = await this.userRoomRepository.findOne({
            where: { user: { id: ownerId }, room: { id: task.room.id } },
        });
        if (!userRoom.isOwner) {
            throw new common_1.UnauthorizedException('You are not allowed to assign task');
        }
        const userRoomAssign = await this.userRoomRepository.findOne({
            where: { user: { id: userId }, room: { id: task.room.id } },
        });
        if (!userRoomAssign) {
            throw new common_1.BadRequestException('User is not in the room');
        }
    }
    async assignTask(taskId, userId) {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['room'],
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        await this.taskRepository.update({ id: taskId }, { user: { id: userId } });
        await this.notificationService.sendNotificationAndSave(userId, 'Assigned to task', `Assigned to task "${taskId}" in room "${task.room.name}"`);
    }
    async getAllTasksOfRoom(roomId) {
        const tasks = await this.taskRepository.find({
            where: { id: roomId },
            relations: ['user'],
        });
        return tasks;
    }
    async getTasksOfRoom(roomId, userId) {
        let tasks;
        let whereOption = { room: { id: roomId } };
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
    async createTaskValidator(task) {
        if (task.dueDate < new Date()) {
            throw new common_1.BadRequestException('Due date is invalid');
        }
        const room = await this.roomRepository.findOne({
            where: { id: task.roomId },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (task.userId) {
            const user = await this.userRepository.findOne({
                where: { id: task.userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const userRoom = await this.userRoomRepository.findOne({
                where: { user: { id: user.id }, room: { id: room.id } },
            });
            if (!userRoom) {
                throw new common_1.BadRequestException('User is not in the room');
            }
        }
    }
    async createTask(task) {
        const newTask = new task_entity_1.Task({});
        newTask.title = task.title;
        newTask.description = task.description;
        newTask.dueDate = task.dueDate;
        newTask.status = task_entity_1.TaskStatus.TODO;
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
        if (task.userId) {
            await this.notificationService.sendNotificationAndSave(task.userId, 'Assigned to task', `Assigned to task ${newTask.title} in room ${newTask.room.name}`);
        }
        return true;
    }
    async updateTaskValidator(taskId, task) {
        if (task.dueDate < new Date()) {
            throw new common_1.BadRequestException('Due date is invalid');
        }
        const existTask = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['room', 'user'],
        });
        if (!existTask) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (task?.userId) {
            const user = await this.userRepository.findOne({
                where: { id: task.userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const userRoom = await this.userRoomRepository.findOne({
                where: { user: { id: user.id }, room: { id: existTask.room.id } },
            });
            if (!userRoom) {
                throw new common_1.BadRequestException('User is not in the room');
            }
        }
    }
    async updateTask(taskId, task) {
        let existTask = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['room'],
        });
        if (!existTask) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (task?.userId) {
            await this.taskRepository.update({ id: taskId }, {
                title: task.title,
                description: task.description,
                dueDate: task.dueDate,
                user: { id: task.userId },
            });
            if (existTask?.user?.id !== task.userId) {
                await this.notificationService.sendNotificationAndSave(task.userId, 'Assigned to task', `Assigned to task ${existTask.title} in room ${existTask.room.name}`);
            }
        }
        else {
            await this.taskRepository.update({ id: taskId }, {
                title: task.title,
                description: task.description,
                dueDate: task.dueDate,
                user: null,
            });
        }
    }
    async deleteTask(id) {
        const existTask = await this.taskRepository.findOne({
            where: { id: id },
        });
        if (!existTask) {
            throw new common_1.NotFoundException('Task not found');
        }
        await this.taskRepository.softDelete({ id });
    }
    async updateStatusTaskValidator(userId, task) {
        const existTask = await this.taskRepository.findOne({
            where: { id: task.taskId },
            relations: ['room', 'user'],
        });
        if (!existTask) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (!Object.values(task_entity_1.TaskStatus).includes(task.status)) {
            throw new common_1.BadRequestException('Status is invalid');
        }
        const userRoom = await this.userRoomRepository.findOne({
            where: { user: { id: userId }, room: { id: existTask.room.id } },
        });
        if (!userRoom.isOwner && !(existTask.user.id === userId)) {
            throw new common_1.UnauthorizedException('You are not allowed to update status');
        }
    }
    async updateStatusTask(curUserId, task) {
        const taskDb = await this.taskRepository.findOne({
            where: { id: task.taskId },
            relations: ['room', 'user'],
        });
        taskDb.status = task.status;
        await this.taskRepository.save(taskDb);
        const roomOwner = await this.userRoomRepository.findOne({
            where: { room: { id: taskDb.room.id }, isOwner: true },
            relations: ['user'],
        });
        if (curUserId !== roomOwner.user.id && task.status === task_entity_1.TaskStatus.DONE) {
            await this.notificationService.sendNotificationAndSave(roomOwner.user.id, 'Task completed', `Task "${taskDb.title}" in room "${taskDb.room.name}" is DONE`);
        }
        return taskDb;
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_2.InjectRepository)(room_entity_1.Room)),
    __param(3, (0, typeorm_2.InjectRepository)(user_room_entity_1.UserRoom)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        notification_service_1.NotificationService])
], TaskService);
//# sourceMappingURL=task.service.js.map