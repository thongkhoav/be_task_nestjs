import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

export interface RoomServiceInterface {
  getUserOfRoom(roomId: string, includeOwner: boolean);
  getAllRooms(userId: string);
  getRoomById(roomId: string);
  isRoomCreator(userId: string, roomId: string); // check if user is room
  isRoomMember(roomId: string, email: string);
  isRoomMemberById(roomId: string, userId: string);
  isRoomExist(roomId: string); // check if user is room
  createRoom(creatorId: string, room: CreateRoomDto);
  updateRoom(room: UpdateRoomDto);

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

  joinRoomValidator(userId: string, inviteCode: string);
  joinRoom(userId: string, inviteCode: string);
}
