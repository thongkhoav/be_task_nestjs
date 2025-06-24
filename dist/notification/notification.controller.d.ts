import { NotificationService } from './notification.service';
import { UpdateFcmTokenDto } from './dto/update-notification.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    testNoti(createNotificationDto: {
        fcmToken: string;
        title: string;
        body: string;
    }): Promise<{
        message: string;
    }>;
    testNotificationToUser(createNotificationDto: {
        userId: string;
        title: string;
        body: string;
    }): Promise<{
        message: string;
    }>;
    updateFcmToken(updateFcmTokenDto: UpdateFcmTokenDto): Promise<{
        message: string;
    }>;
    getNotifications(page: number, pageSize: number, req: any): Promise<{
        data: import("./entities/notification.entity").Notification[];
    }>;
    markAsRead(dto: {
        notificationId: string;
        isReadAll: boolean;
    }, req: any): Promise<{
        message: string;
    }>;
}
