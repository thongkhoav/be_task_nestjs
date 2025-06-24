import { SmallAbstractEntity } from 'src/database/small-abstract.entity';
import { User } from './user.entity';
import { Room } from 'src/room/entities/room.entity';
export declare class UserRoom extends SmallAbstractEntity<UserRoom> {
    user: User;
    room: Room;
    isOwner: boolean;
}
