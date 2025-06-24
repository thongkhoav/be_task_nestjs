import { User } from 'src/auth/entities/user.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
export declare class Notification extends AbstractEntity<Notification> {
    title: string;
    body: string;
    isRead: boolean;
    user: User;
}
