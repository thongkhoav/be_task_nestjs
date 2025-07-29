import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/common/decorators';
import { NotificationQueue } from 'src/queues/notification.queue';

@Controller({
  version: '1',
  path: 'user',
})
export class UserController {
  constructor(
    private readonly userService: UserService,
    private notificationQueue: NotificationQueue,
  ) {}

  @Public()
  @Get('test')
  async test() {
    const delay = new Date().getTime() + 1000 * 30;
    await this.notificationQueue.scheduleTestReminder('Test Task');
    return 'user test';
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
