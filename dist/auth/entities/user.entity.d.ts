import { AbstractEntity } from 'src/database/abstract.entity';
import { UserRoom } from './user-room.entity';
import { Task } from 'src/task/entities/task.entity';
import { Role } from './role.entity';
import { LoginSession } from './login-session.entity';
import { Notification } from 'src/notification/entities/notification.entity';
export declare class User extends AbstractEntity<User> {
    email: string;
    password: string;
    isVerified: boolean;
    fullName: string;
    role: Role;
    userRooms: UserRoom[];
    tasks: Task[];
    sessions: LoginSession[];
    notifications: Notification[];
}
