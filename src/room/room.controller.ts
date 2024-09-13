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
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req) {
    console.log(req?.user);
    const userId = req?.user?.id;

    if (!userId) {
      throw new Error('User not found');
    }
    return this.roomService.createRoom(userId, createRoomDto);
  }

  @Get('/:roomId/users')
  getUserOfRoom(
    @Param('roomId') roomId: string,
    @Query('includeOwner') includeOwner: boolean,
  ) {
    return this.roomService.getUserOfRoom(roomId, includeOwner);
  }

  @Post('/:rooomId/add-member')
  async addMemeber(
    @Body() body: { email: string },
    @Param('roomId') roomId: string,
    @Req() req,
  ) {
    const curUserId = req?.user?.id;

    if (!curUserId) {
      throw new Error('User not found');
    }

    await this.roomService.addMemberValidator(curUserId, body.email, roomId);
    return this.roomService.addMember(body.email, roomId);
  }

  @Delete('/:roomId/remove-member')
  async removeMember(
    @Body() body: { userId: string; removeAll: boolean },
    @Param('roomId') roomId: string,
    @Req() req,
  ) {
    const curUserId = req?.user?.id;

    if (!curUserId) {
      throw new Error('User not found');
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
  getAllRooms(@Req() req) {
    const userId = req?.user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    return this.roomService.getAllRooms(userId);
  }

  @Get('/:roomId')
  getRoomById(@Param('roomId') roomId: string) {
    return this.roomService.getRoomById(roomId);
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
      throw new Error('User not found');
    }

    await this.roomService.removeRoomValidator(curUserId, roomId);

    return await this.roomService.removeRoom(roomId);
  }
}
