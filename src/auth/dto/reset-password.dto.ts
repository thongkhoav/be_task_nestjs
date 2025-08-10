import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 30, {
    message: 'Password must be between 6 and 30 characters long',
  })
  newPassword: string;
}
