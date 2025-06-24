"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const firebase_admin_1 = require("firebase-admin");
const typeorm_1 = require("@nestjs/typeorm");
const login_session_entity_1 = require("../auth/entities/login-session.entity");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const user_entity_1 = require("../auth/entities/user.entity");
let NotificationService = class NotificationService {
    constructor(loginSessionRepository, notificationRepository, userRepository, entityManager) {
        this.loginSessionRepository = loginSessionRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }
    async sendNotification(fcmToken, title, body) {
        try {
            console.log('fcmToken', fcmToken);
            const data = await firebase_admin_1.default.messaging().send({
                token: fcmToken,
                notification: {
                    title,
                    body,
                },
            });
            console.log('Successfully sent message:', data);
        }
        catch (error) {
            console.log('Error sending message:', error);
        }
    }
    async sendNotificationToUser(userId, title, body) {
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
                if (!loginSession?.fcmToken)
                    return;
                await firebase_admin_1.default.messaging().send({
                    token: loginSession.fcmToken,
                    notification: {
                        title,
                        body,
                    },
                });
            }
        }
        catch (error) {
            console.log('Error sending message:', error);
            throw new Error(error.message);
        }
    }
    async sendNotificationAndSave(userId, title, body) {
        try {
            const user = await this.userRepository.findOneBy({
                id: userId,
            });
            if (!user) {
                throw new Error('Invalid user');
            }
            await this.sendNotificationToUser(userId, title, body);
            const notification = new notification_entity_1.Notification({});
            notification.title = title;
            notification.body = body;
            notification.user = user;
            await this.notificationRepository.save(notification);
            console.log('save notification');
        }
        catch (error) {
            console.log('Error sending message:', error);
        }
    }
    async updateFcmToken(updateFcmTokenDto) {
        try {
            await this.entityManager.transaction(async (manager) => {
                await manager.softDelete(login_session_entity_1.LoginSession, {
                    user: { id: updateFcmTokenDto.userId },
                    fcmToken: updateFcmTokenDto.fcmToken,
                });
                const loginSession = await manager.findOne(login_session_entity_1.LoginSession, {
                    where: {
                        refreshToken: updateFcmTokenDto.refreshToken,
                        user: { id: updateFcmTokenDto.userId },
                    },
                });
                if (!loginSession) {
                    throw new common_1.BadRequestException('Invalid fcm token');
                }
                if (new Date(loginSession.refreshTokenExp) < new Date()) {
                    throw new common_1.BadRequestException('Refresh token expired');
                }
                loginSession.fcmToken = updateFcmTokenDto.fcmToken;
                console.log('loginSession', loginSession);
                await manager.save(loginSession);
            });
        }
        catch (error) {
            console.log('Error updating fcm token:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getNotifications(userId, page = 1, pageSize = 10) {
        try {
            const notifications = await this.notificationRepository.find({
                where: { user: { id: userId } },
                order: { createdAt: 'DESC' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            });
            return notifications;
        }
        catch (error) {
            console.log('Error getting notifications:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async markAsRead(userId, notificationId, isReadAll) {
        try {
            console.log('markAsRead', userId, notificationId, isReadAll);
            if (isReadAll) {
                await this.notificationRepository.update({ user: { id: userId } }, { isRead: true });
            }
            else {
                await this.notificationRepository.update({ user: { id: userId }, id: notificationId }, { isRead: true });
            }
        }
        catch (error) {
            console.log('Error marking as read:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_session_entity_1.LoginSession)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectEntityManager)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.EntityManager])
], NotificationService);
//# sourceMappingURL=notification.service.js.map