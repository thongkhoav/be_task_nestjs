import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { UserRoom } from './user-room.entity';
import { Task } from 'src/task/entities/task.entity';
import { Role } from './role.entity';

@Entity()
export class User extends AbstractEntity<User> {
  @Column()
  email: string = '';

  // password
  @Column({ select: false })
  password: string = '';

  @Column({ default: false })
  isVerified: boolean = false;

  // full name
  @Column()
  fullName: string = '';

  @ManyToOne(() => Role, (role) => role.users)
  role: Role; // Foreign key to Role

  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];
}
