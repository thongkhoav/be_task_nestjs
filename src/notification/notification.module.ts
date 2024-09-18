import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { firebaseAdminProvider } from './firebaseAdminProvider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { LoginSession } from 'src/auth/entities/login-session.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, LoginSession, Notification])],
  controllers: [NotificationController],
  providers: [firebaseAdminProvider, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
