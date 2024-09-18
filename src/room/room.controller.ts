import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Controller({ version: '1', path: 'room' })
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post(':roomId/add-member')
  async addMemeber(
    @Body() body: { email: string },
    @Param('roomId') roomId: string,
    @Req() req,
  ) {
    const curUserId = req?.user?.id;

    if (!curUserId) {
      throw new NotFoundException('User not found');
    }
    console.log({ body, roomId });

    await this.roomService.addMemberValidator(curUserId, body.email, roomId);
    return this.roomService.addMember(body.email, roomId);
  }

  @Post('/join-by-invite')
  async joinRoom(
    @Body()
    dto: JoinRoomDto,
    @Req() req,
  ) {
    const userId = req?.user?.id;

    if (!userId) {
      throw new NotFoundException('User not found');
    }
    await this.roomService.joinRoomValidator(userId, dto.inviteCode);
    const roomId = await this.roomService.joinRoom(userId, dto.inviteCode);
    return {
      data: {
        roomId,
      },
    };
  }

  @Post()
  createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req) {
    console.log(req?.user);
    const userId = req?.user?.id;

    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.roomService.createRoom(userId, createRoomDto);
  }

  @Get('/:roomId/users')
  async getUserOfRoom(
    @Param('roomId') roomId: string,
    @Query('includeOwner') includeOwner: string = 'true',
  ) {
    const includeOwnerBool = includeOwner.toLowerCase() === 'true';
    console.log({ roomId, includeOwner });

    const data = await this.roomService.getUserOfRoom(roomId, includeOwnerBool);
    return { data };
  }

  @Delete('/:roomId/remove-member')
  async removeMember(
    @Body() body: { userId: string; removeAll: boolean },
    @Param('roomId') roomId: string,
    @Req() req,
  ) {
    const curUserId = req?.user?.id;

    if (!curUserId) {
      throw new NotFoundException('User not found');
    }

    await this.roomService.removeMemberValidator(
      curUserId,
      body.userId,
      roomId,
      body?.removeAll || false,
    );
    return await this.roomService.removeMember(
      body.userId,
      roomId,
      body?.removeAll || false,
    );
  }

  @Get()
  async getAllRooms(@Req() req) {
    const userId = req?.user?.id;

    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const data = await this.roomService.getAllRooms(userId);
    return { data };
  }

  @Get('/:roomId')
  async getRoomById(@Param('roomId') roomId: string, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new NotFoundException('User not found');
    }
    const data = await this.roomService.getRoomById(curUserId, roomId);
    return { data };
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.roomService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
  //   return this.roomService.update(+id, updateRoomDto);
  // }

  @Delete(':roomId')
  async removeRoom(@Param('roomId') roomId: string, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new NotFoundException('User not found');
    }

    await this.roomService.removeRoomValidator(curUserId, roomId);

    return await this.roomService.removeRoom(roomId);
  }
}
