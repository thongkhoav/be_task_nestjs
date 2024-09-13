import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import { AbstractEntity } from 'src/database/abstract.entity';
import { User } from 'src/auth/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';

@Entity({ name: 'Tasks' })
export class Task extends AbstractEntity<Task> {
  @Column()
  title: string = '';

  @Column()
  description: string = '';

  @Column()
  dueDate: Date;

  @Column({ default: false })
  isComplete: boolean = false;

  @Column()
  review: string = '';

  @ManyToOne(() => User, (user) => user.tasks, { nullable: true })
  user: User;

  @ManyToOne(() => Room, (room) => room.tasks)
  room: Room;
}
