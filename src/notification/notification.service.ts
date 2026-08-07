import { BadRequestException, Injectable } from '@nestjs/common';

import admin from 'firebase-admin';
import { UpdateFcmTokenDto } from './dto/update-notification.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { EntityManager, LessThan, Repository } from 'typeorm';
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
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // test
  async sendNotification(fcmToken: string, title: string, body: string) {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
    });
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
    } catch {}
  }

  async updateFcmToken(updateFcmTokenDto: {
    fcmToken: string;
    userId: string;
  }) {
    try {
      await this.entityManager.transaction(async (manager) => {
        const loginSession = await manager.findOne(LoginSession, {
          where: {
            fcmToken: updateFcmTokenDto.fcmToken,
            user: { id: updateFcmTokenDto.userId },
          },
        });
        if (!loginSession) {
          const newLoginSession = new LoginSession({
            fcmToken: updateFcmTokenDto.fcmToken,
            user: await manager.findOne(User, {
              where: { id: updateFcmTokenDto.userId },
            }),
          });

          // update current login session fcm token
          await manager.save(newLoginSession);
        }
      });
    } catch (error) {
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
      throw new BadRequestException(error.message);
    }
  }

  async markAsRead(userId: string, notificationId: string, isReadAll: boolean) {
    try {
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
      throw new BadRequestException(error.message);
    }
  }
}
