// entities/message.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
import { AbstractEntity } from 'src/database/abstract.entity';

@Entity()
export class Message extends AbstractEntity<Message> {
  @Column()
  content: string;

  @ManyToOne(() => User, (user) => user.messages, { eager: true })
  sender: User;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  @CreateDateColumn()
  createdAt: Date;
}
