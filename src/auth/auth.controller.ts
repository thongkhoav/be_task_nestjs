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

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    const { token, newPassword } = body;

    // try {
    //   const payload = this.jwtService.verify(token, {
    //     secret: process.env.JWT_RESET_SECRET,
    //   });
    //   const user = await this.userRepository.findOne({
    //     where: { id: payload.userId },
    //   });

    //   user.password = await hash(newPassword, 10); // or bcrypt.hash()
    //   await this.userRepository.save(user);
    //   return { message: 'Password reset successfully' };
    // } catch (err) {
    //   throw new BadRequestException('Invalid or expired token');
    // }
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
      this.config.get('COOKIE_AUTH', 'TaskApp_Tokens'),
      JSON.stringify(tokens),
      {
        maxAge:
          this.config.get<number>('REFRESH_TOKEN_DURATION', 60 * 60 * 24 * 7) *
          1000, // 7 days
        // maxAge: 1000 * 60 *
        httpOnly: false, // set to true in production
        secure: false, // set to true in production
      },
    );

    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req,
    @Res({ passthrough: true }) res,
    @GetRequestData('refreshToken') refreshToken: string,
    @GetRequestData('accessToken') accessToken: string,
  ): Promise<string> {
    try {
      const curUserId = req?.user?.id;
      if (!curUserId) {
        throw new BadRequestException('User not found');
      }
      if (!refreshToken || !accessToken) {
        throw new BadRequestException('Tokens not found');
      }
      await this.authService.logout(curUserId, refreshToken, accessToken);
      // clear cookies
      res.cookie(this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'), '', {
        maxAge: 0, // clear cookies
        httpOnly: false, // set to true in production
        secure: false, // set to true in production
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
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @GetCurrentUser('accessToken') accessToken: string,
  ): Promise<Tokens> {
    const tokens = await this.authService.refreshAccessToken(
      userId,
      refreshToken,
      accessToken,
    );
    res.cookie(
      this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens'),
      JSON.stringify(tokens),
      {
        maxAge:
          this.config.get<number>('REFRESH_TOKEN_DURATION', 60 * 60 * 24 * 7) *
          1000,
        httpOnly: false, // set to true in production
        secure: false, // set to true in production
      },
    );
    return tokens;
  }
}
