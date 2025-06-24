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
exports.TaskController = void 0;
const common_1 = require("@nestjs/common");
const task_service_1 = require("./task.service");
const create_task_dto_1 = require("./dto/create-task.dto");
const update_task_status_dto_1 = require("./dto/update-task-status.dto");
const assign_task_dto_1 = require("./dto/assign-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
let TaskController = class TaskController {
    constructor(taskService) {
        this.taskService = taskService;
    }
    async create(createTaskDto) {
        await this.taskService.createTaskValidator(createTaskDto);
        await this.taskService.createTask(createTaskDto);
        return { message: 'Task created' };
    }
    async updateTaskInfo(taskId, dto) {
        await this.taskService.updateTaskValidator(taskId, dto);
        await this.taskService.updateTask(taskId, dto);
        return { message: 'Task updated' };
    }
    async getRoomUserTasks(roomId, userId) {
        const data = await this.taskService.getTasksOfRoom(roomId, userId);
        return { data };
    }
    async updateStatus(updateStatusDto, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new Error('User not found');
        }
        await this.taskService.updateStatusTaskValidator(curUserId, updateStatusDto);
        await this.taskService.updateStatusTask(curUserId, updateStatusDto);
        return { message: 'Task status updated' };
    }
    async assignTask(assignTaskDto, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new Error('User not found');
        }
        await this.taskService.assignTaskValidator(curUserId, assignTaskDto.taskId, assignTaskDto.userId);
        await this.taskService.assignTask(assignTaskDto.taskId, curUserId);
        return { message: 'Task assigned' };
    }
};
exports.TaskController = TaskController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':taskId/update-task-info'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "updateTaskInfo", null);
__decorate([
    (0, common_1.Get)('room/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getRoomUserTasks", null);
__decorate([
    (0, common_1.Patch)('update-status'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_task_status_dto_1.UpdateStatusTaskDTO, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)('assign'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_task_dto_1.AssignTaskDTO, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "assignTask", null);
exports.TaskController = TaskController = __decorate([
    (0, common_1.Controller)({
        version: '1',
        path: 'task',
    }),
    __metadata("design:paramtypes", [task_service_1.TaskService])
], TaskController);
//# sourceMappingURL=task.controller.js.map