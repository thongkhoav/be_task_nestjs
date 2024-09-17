import { IsNotEmpty, IsString } from 'class-validator';

export class JoinRoomDto {
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}
