import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller({
  version: '1',
  path: 'user',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('/')
  @HttpCode(HttpStatus.CREATED)
  async updateUserInfo(@Req() req, @Body() dto: UpdateUserDto) {
    try {
      const curUserId = req?.user?.id;
      if (!curUserId) {
        throw new BadRequestException('User not found');
      }
      await this.userService.updateUserInfo(curUserId, dto);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
