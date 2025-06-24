import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { EntityManager, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { RoomServiceInterface } from './room.service.interface';
import { User } from 'src/auth/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from 'src/notification/notification.service';
import { Task } from 'src/task/entities/task.entity';
export declare class RoomService implements RoomServiceInterface {
    private roomRepository;
    private userRoomRepo;
    private userRepo;
    private taskRepo;
    private entityManager;
    private configService;
    private notificationService;
    constructor(roomRepository: Repository<Room>, userRoomRepo: Repository<UserRoom>, userRepo: Repository<User>, taskRepo: Repository<Task>, entityManager: EntityManager, configService: ConfigService, notificationService: NotificationService);
    leaveRoomValidator(userId: string, roomId: string): Promise<void>;
    leaveRoom(userId: string, roomId: string): Promise<UserRoom>;
    isRoomMemberById(roomId: string, userId: string): Promise<boolean>;
    joinRoomValidator(userId: string, inviteCode: string): Promise<void>;
    joinRoom(userId: string, inviteCode: string): Promise<string>;
    getAllRooms(userId: string): Promise<{
        id: string;
        name: string;
        description: string;
        owner: {
            id: string;
            fullName: string;
        };
    }[]>;
    getRoomById(userId: string, roomId: string): Promise<{
        roomName: string;
        roomDescription: string;
        owner: {
            id: string;
            email: string;
            fullName: string;
        };
        inviteLink: string;
    }>;
    isRoomCreator(userId: string, roomId: string): Promise<boolean>;
    isRoomMember(roomId: string, email: string): Promise<boolean>;
    isRoomExist(roomId: string): Promise<boolean>;
    createRoom(creatorId: string, room: CreateRoomDto): Promise<void>;
    updateRoomValidator(ownerId: string, roomId: string, dto: UpdateRoomDto): Promise<void>;
    updateRoom(roomId: string, dto: UpdateRoomDto): Promise<void>;
    removeRoomValidator(ownerId: string, roomId: string): Promise<void>;
    removeRoom(roomId: string): Promise<void>;
    addMemberValidator(ownerId: string, email: string, roomId: string): Promise<void>;
    addMember(email: string, roomId: string): Promise<void>;
    removeMemberValidator(ownerId: string, userId: string, roomId: string, removeAll: boolean): Promise<void>;
    removeMember(userId: string, roomId: string, removeAll: boolean): Promise<boolean>;
    getUserOfRoom(roomId: string, includeOwner: boolean): Promise<{
        id: string;
        isOwner: boolean;
        user: {
            id: string;
            email: string;
            fullName: string;
        };
    }[]>;
}
