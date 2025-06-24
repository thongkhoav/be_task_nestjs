import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
export interface RoomServiceInterface {
    getUserOfRoom(roomId: string, includeOwner: boolean): any;
    getAllRooms(userId: string): any;
    getRoomById(userId: string, roomId: string): any;
    isRoomCreator(userId: string, roomId: string): any;
    isRoomMember(roomId: string, email: string): any;
    isRoomMemberById(roomId: string, userId: string): any;
    isRoomExist(roomId: string): any;
    createRoom(creatorId: string, room: CreateRoomDto): any;
    updateRoomValidator(ownerId: string, roomId: string, dto: UpdateRoomDto): any;
    updateRoom(roomId: string, dto: UpdateRoomDto): any;
    removeRoomValidator(ownerId: string, roomId: string): any;
    removeRoom(roomId: string): any;
    addMemberValidator(ownerId: string, email: string, roomId: string): Promise<void>;
    addMember(email: string, roomId: string): any;
    removeMemberValidator(ownerId: string, userId: string, roomId: string, removeAll: boolean): any;
    removeMember(userId: string, roomId: string, removeAll: boolean): any;
    leaveRoomValidator(userId: string, roomId: string): any;
    leaveRoom(userId: string, roomId: string): any;
    joinRoomValidator(userId: string, inviteCode: string): any;
    joinRoom(userId: string, inviteCode: string): any;
}
