import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 30, {
    message: 'Password must be between 6 and 30 characters long',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;
}
