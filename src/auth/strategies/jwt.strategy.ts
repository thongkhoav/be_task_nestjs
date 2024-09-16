import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // console.log('jwt strategy', request.cookies);

          let data =
            request?.cookies[this.config.get('COOKIE_AUTH', 'Authentication')];
          console.log({ data });

          if (!data) {
            return null;
          }
          // data = JSON.parse(data);
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }

          return data.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    console.log('validate jwt', payload);

    const user = await this.authService.getUserById(payload.sub);
    return user;
  }
}
