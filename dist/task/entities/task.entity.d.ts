import { AbstractEntity } from 'src/database/abstract.entity';
import { User } from 'src/auth/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
export declare enum TaskStatus {
    TODO = "TODO",
    PROCESSING = "PROCESSING",
    DONE = "DONE"
}
export declare class Task extends AbstractEntity<Task> {
    title: string;
    description: string;
    dueDate: Date;
    status: string;
    review: string;
    user: User;
    room: Room;
}
