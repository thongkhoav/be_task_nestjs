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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const user_room_entity_1 = require("../../auth/entities/user-room.entity");
const abstract_entity_1 = require("../../database/abstract.entity");
const task_entity_1 = require("../../task/entities/task.entity");
const typeorm_1 = require("typeorm");
let Room = class Room extends abstract_entity_1.AbstractEntity {
};
exports.Room = Room;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Room.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Room.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: false }),
    __metadata("design:type", String)
], Room.prototype, "inviteCode", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_room_entity_1.UserRoom, (userRoom) => userRoom.room, {
        cascade: true,
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", Array)
], Room.prototype, "userRooms", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.room, {
        cascade: true,
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", Array)
], Room.prototype, "tasks", void 0);
exports.Room = Room = __decorate([
    (0, typeorm_1.Entity)()
], Room);
//# sourceMappingURL=room.entity.js.map