import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

export interface RoomServiceInterface {
  getUserOfRoom(roomId: string, includeOwner: boolean);
  getAllRooms(userId: string);

  getRoomById(userId: string, roomId: string);

  isRoomCreator(userId: string, roomId: string); // check if user is room
  isRoomMember(roomId: string, email: string);
  isRoomMemberById(roomId: string, userId: string);
  isRoomExist(roomId: string); // check if user is room
  createRoom(creatorId: string, room: CreateRoomDto);

  updateRoomValidator(ownerId: string, roomId: string, dto: UpdateRoomDto);
  updateRoom(roomId: string, dto: UpdateRoomDto);

  removeRoomValidator(ownerId: string, roomId: string);
  removeRoom(roomId: string);

  addMemberValidator(
    ownerId: string,
    email: string,
    roomId: string,
  ): Promise<void>;
  addMember(email: string, roomId: string);

  removeMemberValidator(
    ownerId: string,
    userId: string,
    roomId: string,
    removeAll: boolean,
  );
  removeMember(userId: string, roomId: string, removeAll: boolean);

  leaveRoomValidator(userId: string, roomId: string);
  leaveRoom(userId: string, roomId: string);

  joinRoomValidator(userId: string, inviteCode: string);
  joinRoom(userId: string, inviteCode: string);
}
