import { UpdateFcmTokenDto } from './dto/update-notification.dto';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { EntityManager, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/auth/entities/user.entity';
export declare class NotificationService {
    private loginSessionRepository;
    private notificationRepository;
    private userRepository;
    private readonly entityManager;
    constructor(loginSessionRepository: Repository<LoginSession>, notificationRepository: Repository<Notification>, userRepository: Repository<User>, entityManager: EntityManager);
    sendNotification(fcmToken: string, title: string, body: string): Promise<void>;
    sendNotificationToUser(userId: string, title: string, body: string): Promise<void>;
    sendNotificationAndSave(userId: string, title: string, body: string): Promise<void>;
    updateFcmToken(updateFcmTokenDto: UpdateFcmTokenDto): Promise<void>;
    getNotifications(userId: string, page?: number, pageSize?: number): Promise<Notification[]>;
    markAsRead(userId: string, notificationId: string, isReadAll: boolean): Promise<void>;
}
