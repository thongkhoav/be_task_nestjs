import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

export interface RoomServiceInterface {
  getUserOfRoom(roomId: string, includeOwner: boolean);
  getAllRooms(userId: string);
  getRoomById(roomId: string);
  isRoomCreator(userId: string, roomId: string); // check if user is room
  isRoomMember(roomId: string, email: string);
  isRoomExist(roomId: string); // check if user is room
  createRoom(creatorId: string, room: CreateRoomDto);
  updateRoom(room: UpdateRoomDto);
  deleteRoom(roomId: string);
  addMemberValidator(ownerId: string, email: string, roomId: string);
  addMember(email: string, roomId: string);

  removeMember(userId: string, roomId: string);
}
