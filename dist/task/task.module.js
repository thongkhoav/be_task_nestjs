"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModule = void 0;
const common_1 = require("@nestjs/common");
const task_service_1 = require("./task.service");
const task_controller_1 = require("./task.controller");
const task_entity_1 = require("./entities/task.entity");
const typeorm_1 = require("@nestjs/typeorm");
const room_entity_1 = require("../room/entities/room.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const user_room_entity_1 = require("../auth/entities/user-room.entity");
const notification_service_1 = require("../notification/notification.service");
const login_session_entity_1 = require("../auth/entities/login-session.entity");
const notification_entity_1 = require("../notification/entities/notification.entity");
let TaskModule = class TaskModule {
};
exports.TaskModule = TaskModule;
exports.TaskModule = TaskModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                task_entity_1.Task,
                room_entity_1.Room,
                user_entity_1.User,
                user_room_entity_1.UserRoom,
                login_session_entity_1.LoginSession,
                notification_entity_1.Notification,
            ]),
        ],
        controllers: [task_controller_1.TaskController],
        providers: [task_service_1.TaskService, notification_service_1.NotificationService],
        exports: [task_service_1.TaskService],
    })
], TaskModule);
//# sourceMappingURL=task.module.js.map