// chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/chat/entities/message.entity';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async saveMessage(roomId: string, userId: string, content: string) {
    const room = await this.roomRepo.findOneBy({ id: roomId });
    const user = await this.userRepo.findOneBy({ id: userId });

    const msg = this.messageRepo.create({
      content,
      room,
      sender: user,
    });
    return this.messageRepo.save(msg);
  }

  async getRoomMessages(roomId: string) {
    return this.messageRepo.find({
      where: { room: { id: roomId } },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }
}
