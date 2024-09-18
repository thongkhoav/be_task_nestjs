import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  BadRequestException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Public } from 'src/common/decorators';
import { UpdateFcmTokenDto } from './dto/update-notification.dto';

@Controller({ version: '1', path: 'notification' })
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Public()
  @Post('test-notification')
  async testNoti(
    @Body()
    createNotificationDto: {
      fcmToken: string;
      title: string;
      body: string;
    },
  ) {
    await this.notificationService.sendNotification(
      createNotificationDto.fcmToken,
      createNotificationDto.title,
      createNotificationDto.body,
    );
    return {
      message: 'Notification sent',
    };
  }

  // test send notification to user
  @Public()
  @Post('test-notification-to-user')
  async testNotificationToUser(
    @Body()
    createNotificationDto: {
      userId: string;
      title: string;
      body: string;
    },
  ) {
    await this.notificationService.sendNotificationAndSave(
      createNotificationDto.userId,
      createNotificationDto.title,
      createNotificationDto.body,
    );
    return {
      message: 'Notification sent',
    };
  }

  // update fcm token
  @Patch('update-fcm-token')
  async updateFcmToken(
    @Body()
    updateFcmTokenDto: UpdateFcmTokenDto,
  ) {
    await this.notificationService.updateFcmToken(updateFcmTokenDto);
    return {
      message: 'Fcm token updated',
    };
  }

  // get all notifications of user
  @Get('')
  async getNotifications(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Req() req,
  ) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new UnauthorizedException('User not found');
    }

    const data = await this.notificationService.getNotifications(
      curUserId,
      page,
      pageSize,
    );
    return {
      data,
    };
  }

  // mark notification as read
  @Patch('mark-as-read')
  async markAsRead(
    @Body()
    dto: {
      notificationId: string;
      isReadAll: boolean;
    },
    @Req() req,
  ) {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new UnauthorizedException('User not found');
    }

    await this.notificationService.markAsRead(
      curUserId,
      dto.notificationId,
      dto.isReadAll,
    );
    return {
      message: 'Notification marked as read',
    };
  }
}
