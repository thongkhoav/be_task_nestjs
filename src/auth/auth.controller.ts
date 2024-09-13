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
  Res,
  Version,
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

@Controller({ version: '1', path: 'auth' })
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
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signinLocal(
    @Res({ passthrough: true }) res,
    @Body() dto: LoginRequestDto,
  ): Promise<any> {
    var tokens = await this.authService.login(dto);

    res.cookie(this.config.get('COOKIE_AUTH', 'Authentication'), tokens, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true, // set to true in production
      secure: false, // set to true in production
      sameSite: 'strict', // set to 'none' in production
    });

    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req, @Body() dto: Tokens): Promise<string> {
    try {
      const curUserId = req?.user?.id;
      if (!curUserId) {
        throw new BadRequestException('User not found');
      }
      await this.authService.logout(curUserId);
      return 'Logged out';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('protected')
  @HttpCode(HttpStatus.OK)
  async protected(@Req() request: Request): Promise<any> {
    try {
      console.log('test protected route ', (request as any).user);
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
  // res.cookie('access_token', tokens.access_token, {
  //   maxAge: 1000 * 60 * 60 * 24 * 7,
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'none',
  // });

  // res.cookie('refresh_token', tokens.refresh_token, {
  //   maxAge: 1000 * 60 * 60 * 24 * 7,
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'none',
  // });
  //   return this.authService.refreshTokens(userId, refreshToken);
  // }
}
