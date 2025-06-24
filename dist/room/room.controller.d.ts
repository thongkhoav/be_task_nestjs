import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
export declare class RoomController {
    private readonly roomService;
    constructor(roomService: RoomService);
    addMemeber(body: {
        email: string;
    }, roomId: string, req: any): Promise<void>;
    joinRoom(dto: JoinRoomDto, req: any): Promise<{
        data: {
            roomId: string;
        };
    }>;
    createRoom(createRoomDto: CreateRoomDto, req: any): Promise<void>;
    getUserOfRoom(roomId: string, includeOwner?: string): Promise<{
        data: {
            id: string;
            isOwner: boolean;
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        }[];
    }>;
    removeRoom(roomId: string, req: any): Promise<{
        message: string;
    }>;
    removeMember(body: {
        userId: string;
        removeAll: boolean;
    }, roomId: string, req: any): Promise<boolean>;
    getAllRooms(req: any): Promise<{
        data: {
            id: string;
            name: string;
            description: string;
            owner: {
                id: string;
                fullName: string;
            };
        }[];
    }>;
    getRoomById(roomId: string, req: any): Promise<{
        data: {
            roomName: string;
            roomDescription: string;
            owner: {
                id: string;
                email: string;
                fullName: string;
            };
            inviteLink: string;
        };
    }>;
    leaveRoom(roomId: string, req: any): Promise<{
        message: string;
    }>;
    updateRoom(roomId: string, body: UpdateRoomDto, req: any): Promise<{
        message: string;
    }>;
}
