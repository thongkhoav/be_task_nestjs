import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    private config;
    private jwtService;
    constructor(authService: AuthService, config: ConfigService, jwtService: JwtService);
    validate(payload: JwtPayload): Promise<import("../entities/user.entity").User>;
}
export {};
