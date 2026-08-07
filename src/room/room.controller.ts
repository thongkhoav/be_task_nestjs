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
  Put,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

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
    @Req() req?,
  ) {
    const curUserId = req?.user?.id;
    if (!curUserId) throw new UnauthorizedException('User not found');

    const includeOwnerBool = includeOwner.toLowerCase() === 'true';
    const data = await this.roomService.getUserOfRoom(
      curUserId,
      roomId,
      includeOwnerBool,
    );
    return { data };
  }

  @Delete(':roomId')
  async removeRoom(@Param('roomId') roomId: string, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new NotFoundException('User not found');
    }

    await this.roomService.removeRoomValidator(curUserId, roomId);

    await this.roomService.removeRoom(roomId);
    return { message: 'Room removed' };
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

  @Put('/:roomId/leave')
  async leaveRoom(@Param('roomId') roomId: string, @Req() req) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new NotFoundException('User not found');
    }
    await this.roomService.leaveRoomValidator(curUserId, roomId);
    await this.roomService.leaveRoom(curUserId, roomId);
    return { message: 'Room left' };
  }

  @Put('/:roomId')
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body() body: UpdateRoomDto,
    @Req() req,
  ) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new NotFoundException('User not found');
    }
    await this.roomService.updateRoomValidator(curUserId, roomId, body);
    await this.roomService.updateRoom(roomId, body);
    return { message: 'Room updated' };
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.roomService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
  //   return this.roomService.update(+id, updateRoomDto);
  // }
}
