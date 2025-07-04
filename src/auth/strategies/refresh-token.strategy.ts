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
          console.log('rt jwt strategy', request.cookies);

          let data =
            request?.cookies[this.config.get('COOKIE_AUTH', 'AccessToken')];
          console.log({ data });

          if (!data) {
            return null;
          }
          // data = JSON.parse(data);
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }

          return data.refresh_token;
        },
      ]),
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRt {
    const cookieName = this.config.get<string>('COOKIE_AUTH', 'TaskApp_Tokens');
    console.log('cookie', req?.cookies);
    const tokens = req?.cookies[cookieName];

    if (!tokens) {
      throw new BadRequestException('No tokens found in cookies');
    }
    if (!payload) {
      throw new BadRequestException('Invalid JWT token');
    }
    const parseTokens: Tokens = JSON.parse(tokens);
    if (!parseTokens.access_token) {
      throw new BadRequestException('Invalid access token');
    }
    if (!parseTokens.refresh_token) {
      throw new BadRequestException('Invalid refresh token');
    }

    return {
      ...payload,
      refreshToken: parseTokens.refresh_token,
      accessToken: parseTokens.access_token,
    };
  }
}
