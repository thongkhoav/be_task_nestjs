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
import { AuthenticatedUser, AuthError, Tokens } from './types';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GetRequestData } from 'src/common/decorators/get-request-data.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CookieOptions } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req): Promise<AuthenticatedUser> {
    const curUserId = req?.user?.id;
    if (!curUserId) {
      throw new BadRequestException('User not found');
    }
    return this.authService.getAuthenticatedUserById(curUserId);
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
      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signinLocal(
    @Res({ passthrough: true }) res,
    @Body() dto: LoginRequestDto,
  ): Promise<AuthenticatedUser> {
    const { tokens, user } = await this.authService.login(dto);
    this.setAuthCookie(res, tokens);
    return user;
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard handles redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req, @Res({ passthrough: true }) res) {
    // User object comes from GoogleStrategy.validate()
    const user = req.user;

    const tokens = await this.authService.validateGoogleUser(user);
    this.setAuthCookie(res, tokens);

    res.redirect(
      this.config.get<string>('FE_REDIRECT_URL') ||
        this.config.get<string>('FE_HOST', 'http://localhost:3000'),
    );
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
      this.clearAuthCookie(res);

      return 'Logged out';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('protected')
  @HttpCode(HttpStatus.OK)
  async protected(@Req() request: Request): Promise<any> {
    try {
      return (request as any).user;
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
  ): Promise<{ message: string }> {
    const now = Math.floor(Date.now() / 1000);
    const decoded = this.jwtService.decode(refreshToken);
    if (!decoded || !decoded.sub || decoded.exp < now) {
      this.clearAuthCookie(res);
      if (body.fcmToken) {
        await this.authService.logout(userId, body.fcmToken);
      }
      throw new ForbiddenException(AuthError.REFRESH_TOKEN_EXPIRED);
    }
    const tokens = await this.authService.refreshAccessToken(userId);
    this.setAuthCookie(res, tokens);
    return { message: 'Tokens refreshed' };
  }

  private setAuthCookie(res: any, tokens: Tokens): void {
    res.cookie(
      this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'),
      JSON.stringify(tokens),
      this.getCookieOptions(),
    );
  }

  private clearAuthCookie(res: any): void {
    res.cookie(this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'), '', {
      ...this.getCookieOptions(),
      expires: new Date(0),
      maxAge: 0,
    });
  }

  private getCookieOptions(): CookieOptions {
    const secureSetting = this.config.get<string>('COOKIE_SECURE');
    const secure =
      this.config.get<string>('NODE_ENV') === 'production' ||
      secureSetting === 'true';
    const requestedSameSite = this.config
      .get<string>('COOKIE_SAME_SITE', 'lax')
      .toLowerCase();
    const validSameSite = ['lax', 'strict', 'none'].includes(requestedSameSite)
      ? (requestedSameSite as 'lax' | 'strict' | 'none')
      : 'lax';
    const sameSite =
      validSameSite === 'none' && !secure ? 'lax' : validSameSite;
    const domain = this.config.get<string>('COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge:
        +this.config.get<number>('COOKIE_DURATION', 60 * 60 * 24 * 7) * 1000,
      ...(domain ? { domain } : {}),
    };
  }
}
