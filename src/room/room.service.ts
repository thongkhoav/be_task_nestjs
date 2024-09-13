import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { EntityManager, In, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { RoomServiceInterface } from './room.service.interface';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class RoomService implements RoomServiceInterface {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private userRoomRepo: Repository<UserRoom>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private entityManager: EntityManager,
  ) {}

  async getAllRooms(userId: string) {
    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoin(
        (qb) =>
          qb
            .select('userRoom.roomId')
            .from(UserRoom, 'userRoom')
            .where('userRoom.userId = :userId', { userId })
            .distinctOn(['userRoom.roomId']),
        'joinedRoom',
        'room.id = joinedRoom.roomId',
      )
      .addSelect(
        'CASE WHEN joinedRoom.roomId IS NOT NULL THEN TRUE ELSE FALSE END',
        'isJoined',
      )
      .orderBy('room.createdAt', 'DESC')
      .getRawMany();

    return rooms.map((room) => ({
      id: room.room_id,
      name: room.room_name,
      description: room.room_description,
      isJoined: room.isJoined === 'true', // Convert the string to a boolean
    }));
  }

  async getRoomById(roomId: string) {
    // get user of room by room id through userRoomRepo
    const user = await this.userRoomRepo.find({
      where: { room: { id: roomId }, isOwner: true },
      relations: ['user'],
      select: ['user'],
    });
    const room = await this.roomRepository.findOneBy({ id: roomId });
    return {
      roomName: room.name,
      roomDescription: room.description,
      owner: user.find((u) => u.isOwner).user,
    };
  }

  async isRoomCreator(userId: string, roomId: string) {
    const result = await this.userRoomRepo.findOne({
      where: { room: { id: roomId }, user: { id: userId }, isOwner: true },
    });
    return !!result;
  }

  async isRoomMember(roomId: string, email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      return false;
    }
    const userRoom = await this.userRoomRepo.findOne({
      where: { user: { id: user.id }, room: { id: roomId } },
    });
    return !!userRoom;
  }

  async isRoomExist(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    return !!room;
  }

  async createRoom(creatorId: string, room: CreateRoomDto) {
    console.log('creatorId', creatorId);
    await this.entityManager.transaction(async (manager) => {
      const creator = await this.userRepo.findOneBy({ id: creatorId });
      let userRoom = new UserRoom({ user: creator, isOwner: true });
      let newRoom = new Room(room);
      newRoom.name = room.name;
      newRoom.description = room.description;
      await manager.save(newRoom);
      userRoom.room = newRoom;
      await manager.save(userRoom);
    });
  }

  updateRoom(room: UpdateRoomDto) {
    throw new Error('Method not implemented.');
  }

  deleteRoom(roomId: string) {
    throw new Error('Method not implemented.');
  }

  addMemberValidator(ownerId: string, email: string, roomId: string) {
    // check if user is exist
    if (!this.userRepo.findOne({ where: { email } })) {
      throw new Error('User not found');
    }

    // check if room is exist
    if (!this.roomRepository.findOne({ where: { id: roomId } })) {
      throw new Error('Room not found');
    }

    // check if owner is the owner of the room
    if (!this.isRoomCreator(ownerId, roomId)) {
      throw new Error('You are not the owner of the room');
    }

    // check if user is already a member of the room
    if (this.isRoomMember(roomId, email)) {
      throw new Error('User is already a member of the room');
    }
  }

  async addMember(email: string, roomId: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!user) {
      throw new Error('User not found');
    }
    if (!room) {
      throw new Error('Room not found');
    }
    const userRoom = new UserRoom({ user, room });
    userRoom.isOwner = false;
    await this.userRoomRepo.save(userRoom);
  }
  async removeMember(userId: string, roomId: string): Promise<boolean> {
    var userRoom = await this.userRoomRepo.findOne({
      where: { user: { id: userId }, room: { id: roomId } },
    });
    if (!userRoom) {
      return false;
    }
    await this.userRoomRepo.remove(userRoom);
    return true;
  }

  getUserOfRoom(roomId: string, includeOwner: boolean) {
    var query = this.userRoomRepo.find({
      where: { id: roomId, isOwner: includeOwner },
      relations: ['user'],
    });
    return query;
  }
}
