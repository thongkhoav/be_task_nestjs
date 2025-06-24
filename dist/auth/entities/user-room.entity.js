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
exports.UserRoom = void 0;
const typeorm_1 = require("typeorm");
const small_abstract_entity_1 = require("../../database/small-abstract.entity");
const user_entity_1 = require("./user.entity");
const room_entity_1 = require("../../room/entities/room.entity");
let UserRoom = class UserRoom extends small_abstract_entity_1.SmallAbstractEntity {
};
exports.UserRoom = UserRoom;
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.userRooms),
    __metadata("design:type", user_entity_1.User)
], UserRoom.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_entity_1.Room, (room) => room.userRooms),
    __metadata("design:type", room_entity_1.Room)
], UserRoom.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], UserRoom.prototype, "isOwner", void 0);
exports.UserRoom = UserRoom = __decorate([
    (0, typeorm_1.Entity)()
], UserRoom);
//# sourceMappingURL=user-room.entity.js.map