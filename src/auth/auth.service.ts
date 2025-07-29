import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, EntityManager, LessThan, Repository } from 'typeorm';
import { AuthDto } from './dto';
import { JwtPayload, Tokens } from './types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
const bcrypt = require('bcrypt');
import { v4 as uuidv4 } from 'uuid';
import { LoginRequestDto } from './dto/login-request.dto';
import { Role, RoleType } from './entities/role.entity';
import { LoginSession } from './entities/login-session.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(LoginSession)
    private loginSessionRepository: Repository<LoginSession>,
    private jwtService: JwtService,
    private config: ConfigService,
    private dataSource: DataSource,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async isExistEmail(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
    return user ? true : false;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(dto: AuthDto): Promise<void> {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(dto.password, salt);
    const user = new User({});
    user.email = dto.email;
    user.password = hash;
    user.fullName = dto.fullName;
    let role = await this.roleRepo.findOne({
      where: { title: RoleType.USER },
    });
    if (!role) {
      role = new Role({ title: RoleType.USER });
      await this.roleRepo.save(role);
    }
    user.role = role;
    await this.userRepo.save(user);
  }

  async login(loginRequestDto: LoginRequestDto): Promise<Tokens> {
    const user = await this.userRepo.findOne({
      where: { email: loginRequestDto.email },
      select: ['id', 'password', 'email', 'fullName', 'role'],
      relations: ['role'],
    });
    if (!user) {
      console.log('User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      loginRequestDto.password,
      user.password,
    );
    console.log({
      user,
    });

    if (!isValidPassword) {
      console.log('Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createNewRefreshToken(user);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async logout(userId: string, fcmToken: string): Promise<void> {
    const loginSession = await this.loginSessionRepository.findOne({
      where: { fcmToken: fcmToken, user: { id: userId } },
    });
    console.log('logout: ', {
      userId,
      fcmToken,
      loginSession,
    });
    await this.loginSessionRepository.softRemove(loginSession);
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    const token = this.jwtService.sign(
      { userId: user.id },
      { secret: process.env.JWT_RESET_SECRET, expiresIn: '15m' },
    );

    const resetLink = `${process.env.FRONTEND_URL}/forgot-password?token=${token}`;
    // await this.mailService.sendMail({
    //   to: user.email,
    //   subject: 'Reset your password',
    //   html: `<a href="${resetLink}">Click to reset your password</a>`,
    // });
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
      });
      const user = await this.userRepo.findOne({
        where: { id: decoded.sub },
      });
      return user;
    } catch {
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.userRepo.findOne({
        where: { id },
      });
      return user;
    } catch {
      return null;
    }
  }

  private async createNewRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role.title,
      fullName: user.fullName,
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('REFRESH_TOKEN_DURATION', '7d'),
    });

    return refreshToken;
  }

  async refreshAccessToken(userId: string): Promise<Tokens> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'password', 'email', 'fullName', 'role'],
      relations: ['role'],
    });

    const newAccessToken = await this.createAccessToken(user);
    // create new refresh token
    const newRefreshToken = await this.createNewRefreshToken(user);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  // public async validRefreshToken(
  //   email: string,
  //   refreshToken: string,
  // ): Promise<any> {
  //   let user = await this.userRepo.findOne({
  //     where: {
  //       email: email,
  //     },
  //   });
  //   let loginSession = await this.loginSessionRepository.findOne({
  //     where: {
  //       refreshToken: refreshToken,
  //       user: user,
  //     },
  //   });

  //   // refresh token not found or expired
  //   if (!loginSession || new Date(loginSession.refreshTokenExp) < new Date()) {
  //     await this.loginSessionRepository.softRemove(loginSession);
  //     return null;
  //   }

  //   return loginSession;
  // }

  private async createAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role.title,
      fullName: user.fullName,
    };

    return await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TOKEN_DURATION'),
    });
  }
}
