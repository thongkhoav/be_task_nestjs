import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, RtStrategy } from './strategies';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRoom } from './entities/user-room.entity';
import { Role } from './entities/role.entity';
import { LoginSession } from './entities/login-session.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    TypeOrmModule.forFeature([
      User,
      UserRoom,
      Role,
      Notification,
      LoginSession,
    ]),
  ],
  controllers: [AuthController],
  providers: [RtStrategy, JwtStrategy, AuthService],
  // exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
