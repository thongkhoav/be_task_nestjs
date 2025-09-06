import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}
  async updateUserInfo(userId: string, dto: UpdateUserDto): Promise<void> {
    //update user fullName
    await this.userRepo.update({ id: userId }, { fullName: dto.fullName });
  }
}
