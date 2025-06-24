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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
const decorators_1 = require("../common/decorators");
const update_notification_dto_1 = require("./dto/update-notification.dto");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async testNoti(createNotificationDto) {
        await this.notificationService.sendNotification(createNotificationDto.fcmToken, createNotificationDto.title, createNotificationDto.body);
        return {
            message: 'Notification sent',
        };
    }
    async testNotificationToUser(createNotificationDto) {
        await this.notificationService.sendNotificationAndSave(createNotificationDto.userId, createNotificationDto.title, createNotificationDto.body);
        return {
            message: 'Notification sent',
        };
    }
    async updateFcmToken(updateFcmTokenDto) {
        await this.notificationService.updateFcmToken(updateFcmTokenDto);
        return {
            message: 'Fcm token updated',
        };
    }
    async getNotifications(page = 1, pageSize = 10, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const data = await this.notificationService.getNotifications(curUserId, page, pageSize);
        return {
            data,
        };
    }
    async markAsRead(dto, req) {
        const curUserId = req?.user?.id;
        if (!curUserId) {
            throw new common_1.UnauthorizedException('User not found');
        }
        await this.notificationService.markAsRead(curUserId, dto.notificationId, dto.isReadAll);
        return {
            message: 'Notification marked as read',
        };
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('test-notification'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "testNoti", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('test-notification-to-user'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "testNotificationToUser", null);
__decorate([
    (0, common_1.Patch)('update-fcm-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_notification_dto_1.UpdateFcmTokenDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateFcmToken", null);
__decorate([
    (0, common_1.Get)(''),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('mark-as-read'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)({ version: '1', path: 'notification' }),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map