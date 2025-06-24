import { User } from './user.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
export declare enum RoleType {
    ADMIN = "ADMIN",
    USER = "USER"
}
export declare class Role extends AbstractEntity<Role> {
    title: string;
    users: User[];
}
