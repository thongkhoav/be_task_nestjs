import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { UserRoom } from './user-room.entity';
import { Task } from 'src/task/entities/task.entity';
import { Role } from './role.entity';
import { LoginSession } from './login-session.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Entity()
export class User extends AbstractEntity<User> {
  @Column()
  email: string;

  // password
  @Column({ select: false })
  password: string;

  @Column({ default: false, select: false })
  isVerified: boolean;

  // full name
  @Column()
  fullName: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role; // Foreign key to Role

  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  // many login session
  @OneToMany(() => LoginSession, (session) => session.user)
  sessions: LoginSession[];

  // many notifications
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
