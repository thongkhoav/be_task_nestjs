import { AbstractEntity } from 'src/database/abstract.entity';
import { User } from './user.entity';
export declare class LoginSession extends AbstractEntity<LoginSession> {
    fcmToken: string;
    accessToken: string;
    refreshToken: string;
    refreshTokenExp: Date;
    user: User;
}
