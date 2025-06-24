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
exports.RoomController = void 0;
const common_1 = require("@nestjs/common");
const room_service_1 = require("./room.service");
const create_room_dto_1 = require("./dto/create-room.dto");
const join_room_dto_1 = require("./dto/join-room.dto");
const update_room_dto_1 = require("./dto/update-room.dto");
let RoomController = class RoomController {
    constructor(roomService) {
        this.roomService = roomService;
    }
    async addMemeber(body, roomId, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.NotFoundException('User not found');
        }
        console.log({ body, roomId });
        await this.roomService.addMemberValidator(curUserId, body.email, roomId);
        return this.roomService.addMember(body.email, roomId);
    }
    async joinRoom(dto, req) {
        const userId = req?.user?.id;
        if (!userId) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.roomService.joinRoomValidator(userId, dto.inviteCode);
        const roomId = await this.roomService.joinRoom(userId, dto.inviteCode);
        return {
            data: {
                roomId,
            },
        };
    }
    createRoom(createRoomDto, req) {
        console.log(req?.user);
        const userId = req?.user?.id;
        if (!userId) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.roomService.createRoom(userId, createRoomDto);
    }
    async getUserOfRoom(roomId, includeOwner = 'true') {
        const includeOwnerBool = includeOwner.toLowerCase() === 'true';
        console.log({ roomId, includeOwner });
        const data = await this.roomService.getUserOfRoom(roomId, includeOwnerBool);
        return { data };
    }
    async removeRoom(roomId, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.roomService.removeRoomValidator(curUserId, roomId);
        await this.roomService.removeRoom(roomId);
        return { message: 'Room removed' };
    }
    async removeMember(body, roomId, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.roomService.removeMemberValidator(curUserId, body.userId, roomId, body?.removeAll || false);
        return await this.roomService.removeMember(body.userId, roomId, body?.removeAll || false);
    }
    async getAllRooms(req) {
        const userId = req?.user?.id;
        if (!userId) {
            throw new common_1.NotFoundException('User not found');
        }
        const data = await this.roomService.getAllRooms(userId);
        return { data };
    }
    async getRoomById(roomId, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.NotFoundException('User not found');
        }
        const data = await this.roomService.getRoomById(curUserId, roomId);
        return { data };
    }
    async leaveRoom(roomId, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.roomService.leaveRoomValidator(curUserId, roomId);
        await this.roomService.leaveRoom(curUserId, roomId);
        return { message: 'Room left' };
    }
    async updateRoom(roomId, body, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.roomService.updateRoomValidator(curUserId, roomId, body);
        await this.roomService.updateRoom(roomId, body);
        return { message: 'Room updated' };
    }
};
exports.RoomController = RoomController;
__decorate([
    (0, common_1.Post)(':roomId/add-member'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "addMemeber", null);
__decorate([
    (0, common_1.Post)('/join-by-invite'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [join_room_dto_1.JoinRoomDto, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "joinRoom", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_room_dto_1.CreateRoomDto, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)('/:roomId/users'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Query)('includeOwner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "getUserOfRoom", null);
__decorate([
    (0, common_1.Delete)(':roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "removeRoom", null);
__decorate([
    (0, common_1.Delete)('/:roomId/remove-member'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "getAllRooms", null);
__decorate([
    (0, common_1.Get)('/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "getRoomById", null);
__decorate([
    (0, common_1.Put)('/:roomId/leave'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "leaveRoom", null);
__decorate([
    (0, common_1.Put)('/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_room_dto_1.UpdateRoomDto, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "updateRoom", null);
exports.RoomController = RoomController = __decorate([
    (0, common_1.Controller)({ version: '1', path: 'room' }),
    __metadata("design:paramtypes", [room_service_1.RoomService])
], RoomController);
//# sourceMappingURL=room.controller.js.map