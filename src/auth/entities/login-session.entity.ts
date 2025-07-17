import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class LoginSession extends AbstractEntity<LoginSession> {
  @Column({ nullable: true })
  fcmToken: string;

  // @Column({ type: 'varchar', nullable: true })
  // device_info: string; // Optional device or browser information

  @ManyToOne(() => User, (user) => user.sessions)
  user: User; // Relationship with the User entity
}
