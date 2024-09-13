import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoom } from 'src/auth/entities/user-room.entity';
import { User } from 'src/auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, UserRoom, User])],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
