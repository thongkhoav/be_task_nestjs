import { UserRoom } from 'src/auth/entities/user-room.entity';
import { User } from 'src/auth/entities/user.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Task } from 'src/task/entities/task.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';

@Entity()
export class Room extends AbstractEntity<Room> {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ unique: true, nullable: false })
  inviteCode: string;

  @OneToMany(() => UserRoom, (userRoom) => userRoom.room, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  userRooms: UserRoom[];

  @OneToMany(() => Task, (task) => task.room, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  tasks: Task[];
}
