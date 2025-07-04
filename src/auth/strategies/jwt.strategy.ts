import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, JwtPayloadWithRt, JwtUserWithRt, Tokens } from '../types';
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
          console.log('jwt strategy', request.cookies);

          let data =
            request?.cookies[config.get('COOKIE_AUTH', 'TaskApp_Tokens')];
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
      passReqToCallback: true,
    });
  }

  // decode data.access_token from jwtFromRequest by secretOrKey
  // and return payload
  // returned value of this method will be assigned to request.user
  async validate(req: Request, payload: JwtPayload): Promise<JwtUserWithRt> {
    console.log('validate jwt', payload);
    const user = await this.authService.getUserById(payload.sub);
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
      ...user,
      refreshToken: parseTokens.refresh_token,
      accessToken: parseTokens.access_token,
    } as JwtUserWithRt;
  }
}
