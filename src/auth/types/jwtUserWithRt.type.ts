import { User } from '../entities/user.entity';
import { JwtPayload } from './jwtPayload.type';

export type JwtUserWithRt = User & {
  refreshToken: string;
  accessToken: string;
};
