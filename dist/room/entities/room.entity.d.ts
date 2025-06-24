import { UserRoom } from 'src/auth/entities/user-room.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Task } from 'src/task/entities/task.entity';
export declare class Room extends AbstractEntity<Room> {
    name: string;
    description: string;
    inviteCode: string;
    userRooms: UserRoom[];
    tasks: Task[];
}
