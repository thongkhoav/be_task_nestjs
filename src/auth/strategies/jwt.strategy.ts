import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private authService: AuthService, private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let data =
            request?.cookies[config.get('COOKIE_AUTH', 'TaskApp_Tokens')];
          if (!data) {
            return null;
          }
          try {
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }
            return data.access_token || null;
          } catch {
            return null;
          }
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ACCESS_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  // decode data.access_token from jwtFromRequest by secretOrKey
  // and return payload
  // returned value of this method will be assigned to request.user
  async validate(_req: Request, payload: JwtPayload): Promise<User> {
    if (!payload) {
      throw new BadRequestException('Invalid JWT token');
    }
    const user = await this.authService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
