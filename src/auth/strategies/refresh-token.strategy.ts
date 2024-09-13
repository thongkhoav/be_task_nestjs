import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, JwtPayloadWithRt, Tokens } from '../types';
import { AuthService } from '../auth.service';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private config: ConfigService, private authService: AuthService) {
    super({
      ignoreExpiration: true,
      passReqToCallback: true,
      secretOrKey: config.get<string>('REFRESH_TOKEN_SECRET'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let data: Tokens = request?.cookies['auth-cookie'];
          if (!data) {
            return null;
          }
          return data.access_token;
        },
      ]),
    });
  }

  async validate(req: Request, payload: any) {
    if (!payload) {
      throw new BadRequestException('invalid jwt token');
    }
    let data: Tokens = req?.cookies['auth-cookie'];
    if (!data?.refresh_token) {
      throw new BadRequestException('invalid refresh token');
    }
    let user = await this.authService.validRefreshToken(
      payload.email,
      data.refresh_token,
    );
    if (!user) {
      throw new BadRequestException('Token expired. Please login');
    }

    return user;
  }
}
