import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { EntityManager, In, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { RoomServiceInterface } from './room.service.interface';
import { User } from 'src/auth/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from 'src/notification/notification.service';

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
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async isRoomMemberById(roomId: string, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }
    const userRoom = await this.userRoomRepo.findOne({
      where: { user: { id: user.id }, room: { id: roomId } },
    });
    console.log({
      roomId,
      userId,
    });
    console.log(userRoom);

    return !!userRoom;
  }

  async joinRoomValidator(userId: string, inviteCode: string) {
    if (
      !inviteCode.startsWith(
        this.configService.get<string>('INVITE_PREFIX', 'task_app/invite'),
      )
    ) {
      throw new BadRequestException('Invalid invite code');
    }
    const uuidInviteCode = inviteCode.split('/').pop();

    // check if room is exist
    const existingRoom = await this.roomRepository.findOne({
      where: { inviteCode: uuidInviteCode },
    });
    if (!existingRoom) {
      throw new BadRequestException('Room not found');
    }

    // check if user is exist
    if (!(await this.userRepo.findOne({ where: { id: userId } }))) {
      throw new BadRequestException('User not found');
    }

    // check if user is already a member of the room
    if (await this.isRoomMemberById(existingRoom.id, userId)) {
      throw new BadRequestException('User is already a member of the room');
    }
  }

  async joinRoom(userId: string, inviteCode: string) {
    const uuidInviteCode = inviteCode.split('/').pop();
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const existingRoom = await this.roomRepository.findOne({
      where: { inviteCode: uuidInviteCode },
    });
    const userRoom = new UserRoom({ user, room: existingRoom });
    userRoom.isOwner = false;
    await this.userRoomRepo.save(userRoom);

    const owner = await this.userRoomRepo.findOne({
      where: { room: { id: existingRoom.id }, isOwner: true },
      relations: ['user'],
    });
    if (!owner?.user?.id) return;

    await this.notificationService.sendNotificationAndSave(
      owner.user.id,
      'New member joined room',
      `${user.fullName} joined room ${existingRoom.name}`,
    );
    return existingRoom.id;
  }

  // change get all rooms to get rooms that the user joined
  async getAllRooms(userId: string) {
    // left join will get all rooms
    // userRoom.userId = :userId will get the rooms that the user joined

    // const rooms1 = await this.roomRepository
    //   .createQueryBuilder('room')
    //   // Join userRoom to get all relationships between rooms and users
    //   .leftJoin('room.userRooms', 'userRoom')
    //   // Join userRoom for the owner of the room
    //   .leftJoin('userRoom.user', 'owner')
    //   // Left join to check if the current user has joined the room
    //   .leftJoin(
    //     'room.userRooms',
    //     'currentUserRoom',
    //     'currentUserRoom.userId = :userId',
    //     { userId },
    //   )
    //   .select([
    //     'room.id as room_id',
    //     'room.name as room_name',
    //     'room.description as room_description',
    //     'owner.id as owner_id',
    //     'owner.fullName as owner_name',
    //     'CASE WHEN currentUserRoom.userId IS NOT NULL THEN TRUE ELSE FALSE END as isJoined',
    //   ])
    //   .where('userRoom.isOwner = TRUE') // Get only the owner by checking isOwner field
    //   .getRawMany();
    // console.log(rooms1);

    // const rooms = await this.roomRepository
    //   .createQueryBuilder('room')
    //   .leftJoin('room.userRooms', 'userRoom', 'userRoom.userId = :userId', {
    //     userId,
    //   })
    //   .select([
    //     'room.id as room_id',
    //     'room.name as room_name',
    //     'room.description as room_description',
    //     'CASE WHEN userRoom.userId IS NOT NULL THEN TRUE ELSE FALSE END as isJoined',
    //   ])
    //   .getRawMany();
    // console.log(rooms);
    // return rooms1.map((room) => ({
    //   id: room.room_id,
    //   name: room.room_name,
    //   description: room.room_description,
    //   owner: {
    //     id: room.owner_id,
    //     fullName: room.owner_name,
    //   },
    //   isJoined: room.isjoined, // Convert the string to a boolean
    // }));

    // get user room and owner of the room
    // get all rooms that the user joined
    // relations back to room ->  userRooms -> user to get the owner of the room
    const userRooms = await this.userRoomRepo.find({
      where: { user: { id: userId } },
      relations: ['room', 'room.userRooms', 'room.userRooms.user'],
    });
    // console.log(userRooms);

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

  async getRoomById(roomId: string) {
    // get user of room by room id through userRoomRepo
    const user = await this.userRoomRepo.findOne({
      where: { room: { id: roomId }, isOwner: true },
      relations: ['user'],
      select: ['user'],
    });
    const room = await this.roomRepository.findOneBy({ id: roomId });
    return {
      roomName: room.name,
      roomDescription: room.description,
      owner: {
        id: user.user.id,
        email: user.user.email,
        fullName: user.user.fullName,
      },
      inviteLink:
        room.inviteCode &&
        `${this.configService.get<string>(
          'INVITE_PREFIX',
          'task_app/invite',
        )}/${room.inviteCode}`,
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
    if (!userRoom) {
      console.log('userRoom not found');

      return false;
    }
    return true;
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
      newRoom.inviteCode = uuidv4();
      await manager.save(newRoom);
      userRoom.room = newRoom;
      await manager.save(userRoom);
    });
  }

  updateRoom(room: UpdateRoomDto) {
    throw new BadRequestException('Method not implemented.');
  }

  async removeRoomValidator(ownerId: string, roomId: string): Promise<string> {
    // check if room is exist
    if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
      throw new NotFoundException('Room not found');
    }

    // check if room is empty
    const userRooms = await this.userRoomRepo.find({
      where: { room: { id: roomId } },
    });
    if (userRooms.length > 1) {
      throw new BadRequestException(
        'Room has members. Please remove all members first',
      );
    } else {
      return 'Remove room will remove all members and tasks in the room. Are you sure?';
    }
  }

  async removeRoom(roomId: string) {
    await this.entityManager.transaction(async (manager) => {
      await manager.softRemove(Room, { id: roomId });
    });
  }

  async addMemberValidator(ownerId: string, email: string, roomId: string) {
    // check if user is exist
    if (!(await this.userRepo.findOne({ where: { email } }))) {
      throw new NotFoundException('User not found');
    }

    // check if room is exist
    if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
      throw new NotFoundException('Room not found');
    }

    // check if owner is the owner of the room
    if (!(await this.isRoomCreator(ownerId, roomId))) {
      throw new UnauthorizedException('You are not the owner of the room');
    }

    // check if user is already a member of the room
    if (await this.isRoomMember(roomId, email)) {
      throw new BadRequestException('User is already a member of the room');
    }
  }

  async addMember(email: string, roomId: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    const userRoom = new UserRoom({ user, room });
    userRoom.isOwner = false;
    await this.userRoomRepo.save(userRoom);
  }

  async removeMemberValidator(
    ownerId: string,
    userId: string,
    roomId: string,
    removeAll: boolean,
  ) {
    // check if room is exist
    if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
      throw new NotFoundException('Room not found');
    }

    // check if owner is the owner of the room
    if (!(await this.isRoomCreator(ownerId, roomId))) {
      throw new UnauthorizedException('You are not the owner of the room');
    }

    if (!removeAll) {
      // check if user is exist
      const removeUser = await this.userRepo.findOne({ where: { id: userId } });
      if (!removeUser) {
        throw new NotFoundException('User not found');
      }

      // check if user is already a member of the room
      const userRoom = await this.userRoomRepo.findOne({
        where: {
          user: { id: removeUser.id },
          room: { id: roomId },
          isOwner: false,
        },
      });
      if (!userRoom) {
        return false;
      }
    } else {
      // check if room is empty
      const userRooms = await this.userRoomRepo.find({
        where: { room: { id: roomId } },
      });
      if (userRooms.length <= 1) {
        throw new BadRequestException('Room has no members');
      }
    }
  }

  async removeMember(
    userId: string,
    roomId: string,
    removeAll: boolean,
  ): Promise<boolean> {
    if (removeAll) {
      await this.userRoomRepo.softRemove(
        await this.userRoomRepo.find({
          where: { room: { id: roomId } },
        }),
      );
      return true;
    } else {
      var userRoom = await this.userRoomRepo.findOne({
        where: { user: { id: userId }, room: { id: roomId } },
      });
      if (!userRoom) {
        return false;
      }
      await this.userRoomRepo.softRemove(userRoom);
      return true;
    }
  }

  async getUserOfRoom(roomId: string, includeOwner: boolean) {
    //   const query = this.userRoomRepo.createQueryBuilder('userRoom')
    //   .innerJoinAndSelect('userRoom.user', 'user')
    //   .where('userRoom.room.id = :roomId', { roomId })
    //   .select([
    //     'userRoom.id',
    //     'userRoom.isOwner',
    //     'user.id',
    //     'user.email',
    //     'user.fullName'
    //   ])
    //   .orderBy('userRoom.isOwner', 'DESC')
    //   .addOrderBy('user.fullName', 'ASC');

    // if (!includeOwner) {
    //   query.andWhere('userRoom.isOwner = :isOwner', { isOwner: false });
    // }

    // const result = await query.getMany();

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
        // Sort by isOwner (true comes first)
        if (a.isOwner && !b.isOwner) return -1;
        if (!a.isOwner && b.isOwner) return 1;

        // If isOwner is the same, sort alphabetically by fullName
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
}
