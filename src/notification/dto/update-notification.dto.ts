import { PartialType } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
