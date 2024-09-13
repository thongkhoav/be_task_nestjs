import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';

import { SmallAbstractEntity } from 'src/database/small-abstract.entity';
import { User } from './user.entity';
import { Room } from 'src/room/entities/room.entity';

@Entity()
export class UserRoom extends SmallAbstractEntity<UserRoom> {

  @ManyToOne(() => User, (user) => user.userRooms)
  user: User;

  @ManyToOne(() => Room, (room) => room.userRooms)
  room: Room;

  @Column({ default: false })
  isOwner: boolean; // Custom field
}
