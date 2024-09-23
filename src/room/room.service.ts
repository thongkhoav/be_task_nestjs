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
import { Task } from 'src/task/entities/task.entity';

@Injectable()
export class RoomService implements RoomServiceInterface {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private userRoomRepo: Repository<UserRoom>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private entityManager: EntityManager,
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}
  async leaveRoomValidator(userId: string, roomId: string) {
    // check if user is exist
    if (!(await this.userRepo.findOne({ where: { id: userId } }))) {
      throw new NotFoundException('User not found');
    }

    // check if room is exist
    if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
      throw new NotFoundException('Room not found');
    }

    // check if user is a member of the room
    if (!(await this.isRoomMemberById(roomId, userId))) {
      throw new BadRequestException('User is not a member of the room');
    }

    // check if user is the owner of the room
    if (await this.isRoomCreator(userId, roomId)) {
      throw new BadRequestException('Owner cannot leave the room');
    }
  }

  async leaveRoom(userId: string, roomId: string) {
    const userRoom = await this.userRoomRepo.findOne({
      where: { user: { id: userId }, room: { id: roomId }, isOwner: false },
      relations: ['user', 'room'],
    });
    if (!userRoom) {
      throw new NotFoundException('User is not a member of the room');
    }
    await this.taskRepo.update(
      { user: { id: userId }, room: { id: roomId } },
      { user: null },
    );
    await this.userRoomRepo.softRemove(userRoom);
    const owner = await this.userRoomRepo.findOne({
      where: { room: { id: roomId }, isOwner: true },
      relations: ['user'],
    });
    await this.notificationService.sendNotificationAndSave(
      owner.user.id,
      'Member left room',
      `${userRoom.user.fullName} left room ${userRoom.room.name}`,
    );
  }

  async isRoomMemberById(roomId: string, userId: string) {
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
    const isRoomMember = await this.isRoomMemberById(existingRoom.id, userId);
    if (isRoomMember) {
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

  async getRoomById(userId: string, roomId: string) {
    // get user of room by room id through userRoomRepo
    const userRoom = await this.userRoomRepo.findOne({
      where: { user: { id: userId }, room: { id: roomId } },
    });
    if (!userRoom) {
      throw new NotFoundException('User is not a member of the room');
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

  async updateRoomValidator(
    ownerId: string,
    roomId: string,
    dto: UpdateRoomDto,
  ) {
    // check if room is exist
    if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
      throw new NotFoundException('Room not found');
    }

    // check if owner is the owner of the room
    if (!(await this.isRoomCreator(ownerId, roomId))) {
      throw new UnauthorizedException('You are not the owner of the room');
    }
  }

  async updateRoom(roomId: string, dto: UpdateRoomDto) {
    await this.roomRepository.update({ id: roomId }, dto);
  }

  async removeRoomValidator(ownerId: string, roomId: string): Promise<void> {
    // check if room is exist
    if (!(await this.roomRepository.findOne({ where: { id: roomId } }))) {
      throw new NotFoundException('Room not found');
    }

    // check if owner is the owner of the room
    if (!(await this.isRoomCreator(ownerId, roomId))) {
      throw new UnauthorizedException('You are not the owner of the room');
    }

    // check if room is empty
    // const userRooms = await this.userRoomRepo.find({
    //   where: { room: { id: roomId } },
    // });
    // if (userRooms.length > 1) {
    //   throw new BadRequestException(
    //     'Room has members. Please remove all members first',
    //   );
    // } else {
    //   return 'Remove room will remove all members and tasks in the room. Are you sure?';
    // }
  }

  async removeRoom(roomId: string) {
    await this.entityManager.transaction(async (manager) => {
      const room = await manager.findOne(Room, {
        where: { id: roomId },
        relations: ['userRooms', 'tasks'],
      });
      if (!room) {
        throw new NotFoundException(`Room with ID "${roomId}" not found`);
      }

      // Soft delete related UserRoom entries
      if (room.userRooms) {
        await manager.softRemove(UserRoom, room.userRooms);
      }

      // Soft delete related Task entries
      if (room.tasks) {
        await manager.softRemove(Task, room.tasks);
      }

      // Finally, soft delete the Room
      await manager.softRemove(Room, room);
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
    await this.notificationService.sendNotificationAndSave(
      user.id,
      'Invited to the room',
      `You have been invited to the room ${room.name}`,
    );
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
        throw new BadRequestException('User is not a member of the room');
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
    // check room owner in validator

    if (removeAll) {
      // remove all members but owner curUserId
      // also unassign all tasks
      const members = await this.userRoomRepo.find({
        where: { room: { id: roomId }, isOwner: false },
      });
      for (const member of members) {
        // unassign all tasks
        await this.taskRepo.update(
          { user: { id: member.user.id }, room: { id: roomId } },
          { user: null },
        );
        await this.userRoomRepo.softRemove(member);
        await this.notificationService.sendNotificationAndSave(
          member.user.id,
          'Removed from the room',
          `You have been removed from the room by the owner`,
        );
      }
      return true;
    } else {
      var userRoom = await this.userRoomRepo.findOne({
        where: { user: { id: userId }, room: { id: roomId } },
      });
      if (!userRoom) {
        return false;
      }
      // unassign all tasks
      await this.taskRepo.update(
        { user: { id: userId }, room: { id: roomId } },
        { user: null },
      );
      await this.userRoomRepo.softRemove(userRoom);
      await this.notificationService.sendNotificationAndSave(
        userId,
        'Removed from the room',
        `You have been removed from the room by the owner`,
      );
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
