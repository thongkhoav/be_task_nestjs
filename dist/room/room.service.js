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
exports.RoomService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const room_entity_1 = require("./entities/room.entity");
const typeorm_2 = require("@nestjs/typeorm");
const user_room_entity_1 = require("../auth/entities/user-room.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const notification_service_1 = require("../notification/notification.service");
const task_entity_1 = require("../task/entities/task.entity");
let RoomService = class RoomService {
    constructor(roomRepository, userRoomRepo, userRepo, taskRepo, entityManager, configService, notificationService) {
        this.roomRepository = roomRepository;
        this.userRoomRepo = userRoomRepo;
        this.userRepo = userRepo;
        this.taskRepo = taskRepo;
        this.entityManager = entityManager;
        this.configService = configService;
        this.notificationService = notificationService;
    }
    async leaveRoomValidator(userId, roomId) {
        if (!(await this.userRepo.findOne({ where: { id: userId } }))) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (!(await this.isRoomMemberById(roomId, userId))) {
            throw new common_1.BadRequestException('User is not a member of the room');
        }
        if (await this.isRoomCreator(userId, roomId)) {
            throw new common_1.BadRequestException('Owner cannot leave the room');
        }
    }
    async leaveRoom(userId, roomId) {
        const userRoom = await this.userRoomRepo.findOne({
            where: { user: { id: userId }, room: { id: roomId }, isOwner: false },
            relations: ['user', 'room'],
        });
        if (!userRoom) {
            throw new common_1.NotFoundException('User is not a member of the room');
        }
        await this.entityManager.transaction(async (manager) => {
            await manager.softRemove(userRoom);
            await manager.update(task_entity_1.Task, { user: { id: userId }, room: { id: roomId } }, { user: null });
        });
        const owner = await this.userRoomRepo.findOne({
            where: { room: { id: roomId }, isOwner: true },
            relations: ['user'],
        });
        await this.notificationService.sendNotificationAndSave(owner.user.id, 'Member left room', `${userRoom.user.fullName} left room ${userRoom.room.name}`);
        return userRoom;
    }
    async isRoomMemberById(roomId, userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return false;
        }
        const userRoom = await this.userRoomRepo.findOne({
            where: { user: { id: user.id }, room: { id: roomId } },
        });
        console.log('isRoomMemberById');
        console.log({
            roomId,
            userId,
        });
        console.log(userRoom);
        return !!userRoom;
    }
    async joinRoomValidator(userId, inviteCode) {
        if (!inviteCode.startsWith(this.configService.get('INVITE_PREFIX', 'task_app/invite'))) {
            throw new common_1.BadRequestException('Invalid invite code');
        }
        const uuidInviteCode = inviteCode.split('/').pop();
        const existingRoom = await this.roomRepository.findOne({
            where: { inviteCode: uuidInviteCode },
        });
        if (!existingRoom) {
            throw new common_1.BadRequestException('Room not found');
        }
        if (!(await this.userRepo.findOne({ where: { id: userId } }))) {
            throw new common_1.BadRequestException('User not found');
        }
        const isRoomMember = await this.isRoomMemberById(existingRoom.id, userId);
        if (isRoomMember) {
            throw new common_1.BadRequestException('User is already a member of the room');
        }
    }
    async joinRoom(userId, inviteCode) {
        const uuidInviteCode = inviteCode.split('/').pop();
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const existingRoom = await this.roomRepository.findOne({
            where: { inviteCode: uuidInviteCode },
        });
        const userRoom = new user_room_entity_1.UserRoom({ user, room: existingRoom });
        userRoom.isOwner = false;
        await this.userRoomRepo.save(userRoom);
        const owner = await this.userRoomRepo.findOne({
            where: { room: { id: existingRoom.id }, isOwner: true },
            relations: ['user'],
        });
        if (!owner?.user?.id)
            return;
        await this.notificationService.sendNotificationAndSave(owner.user.id, 'New member joined room', `${user.fullName} joined room "${existingRoom.name}"`);
        return existingRoom.id;
    }
    async getAllRooms(userId) {
        const userRooms = await this.userRoomRepo.find({
            where: { user: { id: userId } },
            relations: ['room', 'room.userRooms', 'room.userRooms.user'],
        });
        return userRooms.map((userRoom) => {
            const room = userRoom.room;
            const owner = room.userRooms.find((userRoom) => userRoom.isOwner);
            return {
                id: room.id,
                name: room.name,
                description: room.description,
                owner: {
                    id: owner.user.id,
                    fullName: owner.user.fullName,
                },
            };
        });
    }
    async getRoomById(userId, roomId) {
        const userRoom = await this.userRoomRepo.findOne({
            where: { user: { id: userId }, room: { id: roomId } },
        });
        if (!userRoom) {
            throw new common_1.NotFoundException('User is not a member of the room');
        }
        const owner = await this.userRoomRepo.findOne({
            where: { room: { id: roomId }, isOwner: true },
            relations: ['user'],
            select: ['user'],
        });
        const room = await this.roomRepository.findOneBy({ id: roomId });
        return {
            roomName: room.name,
            roomDescription: room.description,
            owner: {
                id: owner.user.id,
                email: owner.user.email,
                fullName: owner.user.fullName,
            },
            inviteLink: room.inviteCode &&
                `${this.configService.get('INVITE_PREFIX', 'task_app/invite')}/${room.inviteCode}`,
        };
    }
    async isRoomCreator(userId, roomId) {
        const result = await this.userRoomRepo.findOne({
            where: { room: { id: roomId }, user: { id: userId }, isOwner: true },
        });
        return !!result;
    }
    async isRoomMember(roomId, email) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            return false;
        }
        const userRoom = await this.userRoomRepo.findOne({
            where: { user: { id: user.id }, room: { id: roomId } },
        });
        if (!userRoom) {
            console.log('userRoom not found');
            return false;
        }
        return true;
    }
    async isRoomExist(roomId) {
        const room = await this.roomRepository.findOne({ where: { id: roomId } });
        return !!room;
    }
    async createRoom(creatorId, room) {
        console.log('creatorId', creatorId);
        await this.entityManager.transaction(async (manager) => {
            const creator = await this.userRepo.findOneBy({ id: creatorId });
            let userRoom = new user_room_entity_1.UserRoom({ user: creator, isOwner: true });
            let newRoom = new room_entity_1.Room(room);
            newRoom.name = room.name;
            newRoom.description = room.description;
            newRoom.inviteCode = (0, uuid_1.v4)();
            await manager.save(newRoom);
            userRoom.room = newRoom;
            await manager.save(userRoom);
        });
    }
    async updateRoomValidator(ownerId, roomId, dto) {
        if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (!(await this.isRoomCreator(ownerId, roomId))) {
            throw new common_1.UnauthorizedException('You are not the owner of the room');
        }
    }
    async updateRoom(roomId, dto) {
        await this.roomRepository.update({ id: roomId }, dto);
    }
    async removeRoomValidator(ownerId, roomId) {
        if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (!(await this.isRoomCreator(ownerId, roomId))) {
            throw new common_1.UnauthorizedException('You are not the owner of the room');
        }
    }
    async removeRoom(roomId) {
        await this.entityManager.transaction(async (manager) => {
            const room = await manager.findOne(room_entity_1.Room, {
                where: { id: roomId },
                relations: ['userRooms', 'tasks'],
            });
            if (!room) {
                throw new common_1.NotFoundException(`Room with ID "${roomId}" not found`);
            }
            if (room.userRooms) {
                await manager.softRemove(user_room_entity_1.UserRoom, room.userRooms);
            }
            if (room.tasks) {
                await manager.softRemove(task_entity_1.Task, room.tasks);
            }
            await manager.softRemove(room_entity_1.Room, room);
        });
    }
    async addMemberValidator(ownerId, email, roomId) {
        if (!(await this.userRepo.findOne({ where: { email } }))) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (!(await this.isRoomCreator(ownerId, roomId))) {
            throw new common_1.UnauthorizedException('You are not the owner of the room');
        }
        if (await this.isRoomMember(roomId, email)) {
            throw new common_1.BadRequestException('User is already a member of the room');
        }
    }
    async addMember(email, roomId) {
        const user = await this.userRepo.findOne({ where: { email } });
        const room = await this.roomRepository.findOne({ where: { id: roomId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        const userRoom = new user_room_entity_1.UserRoom({ user, room });
        userRoom.isOwner = false;
        await this.userRoomRepo.save(userRoom);
        await this.notificationService.sendNotificationAndSave(user.id, 'Invited to the room', `You have been invited to the room ${room.name}`);
    }
    async removeMemberValidator(ownerId, userId, roomId, removeAll) {
        if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (!(await this.isRoomCreator(ownerId, roomId))) {
            throw new common_1.UnauthorizedException('You are not the owner of the room');
        }
        if (!removeAll) {
            const removeUser = await this.userRepo.findOne({ where: { id: userId } });
            if (!removeUser) {
                throw new common_1.NotFoundException('User not found');
            }
            const userRoom = await this.userRoomRepo.findOne({
                where: {
                    user: { id: removeUser.id },
                    room: { id: roomId },
                    isOwner: false,
                },
            });
            if (!userRoom) {
                throw new common_1.BadRequestException('User is not a member of the room');
            }
        }
        else {
            const userRooms = await this.userRoomRepo.find({
                where: { room: { id: roomId } },
            });
            if (userRooms.length <= 1) {
                throw new common_1.BadRequestException('Room has no members');
            }
        }
    }
    async removeMember(userId, roomId, removeAll) {
        if (removeAll) {
            const members = await this.userRoomRepo.find({
                where: { room: { id: roomId }, isOwner: false },
            });
            for (const member of members) {
                await this.taskRepo.update({ user: { id: member.user.id }, room: { id: roomId } }, { user: null });
                await this.userRoomRepo.softRemove(member);
                await this.notificationService.sendNotificationAndSave(member.user.id, 'Removed from the room', `You have been removed from the room by the owner`);
            }
            return true;
        }
        else {
            var userRoom = await this.userRoomRepo.findOne({
                where: { user: { id: userId }, room: { id: roomId } },
            });
            if (!userRoom) {
                return false;
            }
            await this.taskRepo.update({ user: { id: userId }, room: { id: roomId } }, { user: null });
            await this.userRoomRepo.softRemove(userRoom);
            await this.notificationService.sendNotificationAndSave(userId, 'Removed from the room', `You have been removed from the room by the owner`);
            return true;
        }
    }
    async getUserOfRoom(roomId, includeOwner) {
        var query = await this.userRoomRepo.find({
            where: { room: { id: roomId } },
            relations: ['user'],
            select: {
                user: {
                    id: true,
                    email: true,
                    fullName: true,
                },
                isOwner: true,
            },
        });
        if (!includeOwner) {
            query = query.filter((userRoom) => !userRoom.isOwner);
        }
        const sortedResult = query
            .sort((a, b) => {
            if (a.isOwner && !b.isOwner)
                return -1;
            if (!a.isOwner && b.isOwner)
                return 1;
            return a.user.fullName.localeCompare(b.user.fullName);
        })
            .map((userRoom) => ({
            id: userRoom.id,
            isOwner: userRoom.isOwner,
            user: {
                id: userRoom.user.id,
                email: userRoom.user.email,
                fullName: userRoom.user.fullName,
            },
        }));
        return sortedResult;
    }
};
exports.RoomService = RoomService;
exports.RoomService = RoomService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(room_entity_1.Room)),
    __param(1, (0, typeorm_2.InjectRepository)(user_room_entity_1.UserRoom)),
    __param(2, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_2.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.EntityManager,
        config_1.ConfigService,
        notification_service_1.NotificationService])
], RoomService);
//# sourceMappingURL=room.service.js.map