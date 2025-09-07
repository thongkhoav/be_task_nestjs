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
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
} from 'src/common/decorators';
import { AuthDto } from './dto';
import { AuthError, JwtPayloadWithRt, Tokens } from './types';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GetRequestData } from 'src/common/decorators/get-request-data.decorator';
import { User } from './entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req): Promise<User> {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new BadRequestException('User not found');
    }
    return this.authService.getUserById(curUserId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.CREATED)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<string> {
    try {
      let isExist = await this.authService.isExistEmail(dto.email);
      if (!isExist) {
        throw new BadRequestException('User with this email does not exist');
      }
      await this.authService.requestPasswordReset(dto.email);
      return 'Password reset link sent to your email';
    } catch (error) {
      console.log(error);

      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    const { token, newPassword } = body;

    try {
      await this.authService.resetPassword(newPassword, token);
      return { message: 'Password reset successfully' };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

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
  async signinLocal(
    @Res({ passthrough: true }) res,
    @Body() dto: LoginRequestDto,
  ): Promise<any> {
    var tokens = await this.authService.login(dto);

    res.cookie(
      this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'),
      JSON.stringify(tokens),
      {
        maxAge:
          +this.config.get<number>('COOKIE_DURATION', 60 * 60 * 24 * 7) * 1000, // 7 days
        sameSite: 'none',
        httpOnly: this.config.get<boolean>('Cookie_HttpOnly', false), // set to true in production
        secure: this.config.get<boolean>('Cookie_Secure', false), // set to true in production
      },
    );

    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req,
    @Res({ passthrough: true }) res,
    @Body() body: { fcmToken: string },
  ): Promise<string> {
    try {
      const curUserId = req?.user?.id;
      if (!curUserId) {
        throw new BadRequestException('User not found');
      }
      if (body.fcmToken) {
        await this.authService.logout(curUserId, body.fcmToken);
      }

      // clear cookies
      res.cookie(this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'), '', {
        maxAge: 0, // clear cookies
        sameSite: 'none',
        httpOnly: this.config.get<boolean>('Cookie_HttpOnly', false), // set to true in production
        secure: this.config.get<boolean>('Cookie_Secure', false), // set to true in production
      });

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

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Res({ passthrough: true }) res,
    @Body() body: { fcmToken: string },
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    const now = Math.floor(Date.now() / 1000);
    const decoded = this.jwtService.decode(refreshToken);
    if (!decoded || !decoded.sub || decoded.exp < now) {
      res.cookie(this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'), '', {
        maxAge: 0, // clear cookies
        sameSite: 'none',
        httpOnly: this.config.get<boolean>('Cookie_HttpOnly', false), // set to true in production
        secure: this.config.get<boolean>('Cookie_Secure', false), // set to true in production
      });
      if (body.fcmToken) {
        await this.authService.logout(userId, body.fcmToken);
      }
      throw new ForbiddenException(AuthError.REFRESH_TOKEN_EXPIRED);
    }
    const tokens = await this.authService.refreshAccessToken(userId);
    res.cookie(
      this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'),
      JSON.stringify(tokens),
      {
        sameSite: 'none',
        maxAge:
          +this.config.get<number>('COOKIE_DURATION', 60 * 60 * 24 * 7) * 1000,
        httpOnly: this.config.get<boolean>('Cookie_HttpOnly', false), // set to true in production
        secure: this.config.get<boolean>('Cookie_Secure', false), // set to true in production
      },
    );
    return tokens;
  }
}
