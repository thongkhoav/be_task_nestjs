import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
} from 'src/common/decorators';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signupLocal(@Body() dto: AuthDto): Promise<any> {
    try {
      let isExist = await this.authService.isExistEmail(dto.email);
      if (isExist) {
        throw new BadRequestException('User with this email already exists');
      }
      await this.authService.register(dto);
      return 'User created';
    } catch (error) {
      console.log(error);

      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signinLocal(@Body() dto: LoginRequestDto): Promise<Tokens> {
    try {
      // var tokens = await this.authService.login(dto);
      // return tokens;
      const access_token = await this.jwtService.signAsync(
        { user: 'khoa' },
        {
          secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
          expiresIn: this.config.get<string>('ACCESS_TOKEN_DURATION'),
        },
      );
      return {
        access_token,
        refresh_token: '432985637s',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: Tokens): Promise<string> {
    try {
      await this.authService.logout(dto);
      return 'Logged out';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('protected')
  @HttpCode(HttpStatus.OK)
  async protected(@Req() request: Request): Promise<any> {
    try {
      console.log('request user', (request as any).user);
      return 'asasd';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @Public()
  // @UseGuards(RefreshTokenGuard)
  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // refreshTokens(
  //   @GetCurrentUserId() userId: number,
  //   @GetCurrentUser('refreshToken') refreshToken: string,
  // ): Promise<Tokens> {
  //   return this.authService.refreshTokens(userId, refreshToken);
  // }
}
