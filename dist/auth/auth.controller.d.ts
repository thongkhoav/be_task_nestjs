import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private authService;
    private jwtService;
    private config;
    constructor(authService: AuthService, jwtService: JwtService, config: ConfigService);
    signupLocal(dto: AuthDto): Promise<any>;
    signinLocal(res: any, dto: LoginRequestDto): Promise<any>;
    logout(req: any, res: any, dto: Tokens): Promise<string>;
    protected(request: Request): Promise<any>;
}
