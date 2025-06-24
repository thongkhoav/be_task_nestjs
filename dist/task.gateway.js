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
exports.TaskGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const task_service_1 = require("./task/task.service");
const task_entity_1 = require("./task/entities/task.entity");
const common_1 = require("@nestjs/common");
let TaskGateway = class TaskGateway {
    constructor(taskService) {
        this.taskService = taskService;
    }
    handleJoinRoom(roomId, client) {
        client.join(roomId);
        console.log(`Client ${client.id} joined room ${roomId}`);
    }
    async handleTaskUpdate(data) {
        if (!data.curUserId ||
            !data.taskId ||
            !data.status ||
            !Object.values(task_entity_1.TaskStatus).includes(data.status)) {
            throw new Error('Invalid data provided');
        }
        const updated = await this.taskService.updateStatusTask(data.curUserId, {
            taskId: data.taskId,
            status: data.status,
        });
        this.server.to(updated.room.id).emit('task_updated', updated);
    }
    emitTaskUpdatedToRoom(roomId, task) {
        this.server.to(roomId).emit('task_updated', task);
    }
};
exports.TaskGateway = TaskGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TaskGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TaskGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update_task'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskGateway.prototype, "handleTaskUpdate", null);
exports.TaskGateway = TaskGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [task_service_1.TaskService])
], TaskGateway);
//# sourceMappingURL=task.gateway.js.map