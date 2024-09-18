import { BadRequestException, Injectable } from '@nestjs/common';

import admin from 'firebase-admin';
import { UpdateFcmTokenDto } from './dto/update-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(LoginSession)
    private loginSessionRepository: Repository<LoginSession>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // test
  async sendNotification(fcmToken: string, title: string, body: string) {
    try {
      console.log('fcmToken', fcmToken);

      const data = await admin.messaging().send({
        token: fcmToken,
        notification: {
          title,
          body,
        },
      });
      console.log('Successfully sent message:', data);
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }

  async sendNotificationToUser(userId: string, title: string, body: string) {
    try {
      const loginSessions = await this.loginSessionRepository.find({
        where: { user: { id: userId } },
      });
      if (!loginSessions) {
        throw new Error('Invalid user');
      }
      for (const loginSession of loginSessions) {
        if (new Date(loginSession.refreshTokenExp) < new Date()) {
          await this.loginSessionRepository.softRemove(loginSession);
          throw new Error('Refresh token expired');
        }
        if (!loginSession?.fcmToken) return;
        await admin.messaging().send({
          token: loginSession.fcmToken,
          notification: {
            title,
            body,
          },
        });
      }
    } catch (error) {
      console.log('Error sending message:', error);
      throw new Error(error.message);
    }
  }

  // consume by other services
  async sendNotificationAndSave(userId: string, title: string, body: string) {
    try {
      const user = await this.userRepository.findOneBy({
        id: userId,
      });
      if (!user) {
        throw new Error('Invalid user');
      }
      await this.sendNotificationToUser(userId, title, body);

      const notification = new Notification({});
      notification.title = title;
      notification.body = body;
      notification.user = user;
      await this.notificationRepository.save(notification);
      console.log('save notification');
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }

  async updateFcmToken(updateFcmTokenDto: UpdateFcmTokenDto) {
    try {
      const loginSession = await this.loginSessionRepository.findOne({
        where: {
          refreshToken: updateFcmTokenDto.refreshToken,
          user: { id: updateFcmTokenDto.userId },
        },
      });
      if (!loginSession) {
        throw new BadRequestException('Invalid fcm token');
      }
      if (new Date(loginSession.refreshTokenExp) < new Date()) {
        throw new BadRequestException('Refresh token expired');
      }
      loginSession.fcmToken = updateFcmTokenDto.fcmToken;
      console.log('loginSession', loginSession);

      await this.loginSessionRepository.save(loginSession);
    } catch (error) {
      console.log('Error updating fcm token:', error);
      throw new BadRequestException(error.message);
    }
  }

  async getNotifications(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    try {
      const notifications = await this.notificationRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      });
      return notifications;
    } catch (error) {
      console.log('Error getting notifications:', error);
      throw new BadRequestException(error.message);
    }
  }

  async markAsRead(userId: string, notificationId: string, isReadAll: boolean) {
    try {
      console.log('markAsRead', userId, notificationId, isReadAll);

      if (isReadAll) {
        await this.notificationRepository.update(
          { user: { id: userId } },
          { isRead: true },
        );
      } else {
        await this.notificationRepository.update(
          { user: { id: userId }, id: notificationId },
          { isRead: true },
        );
      }
    } catch (error) {
      console.log('Error marking as read:', error);
      throw new BadRequestException(error.message);
    }
  }
}
