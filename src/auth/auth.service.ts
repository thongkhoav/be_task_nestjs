import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
const bcrypt = require('bcrypt');
import { v4 as uuidv4 } from 'uuid';
import { LoginRequestDto } from './dto/login-request.dto';
import { Role, RoleType } from './entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
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
      select: [
        'id',
        'password',
        'createdAt',
        'updatedAt',
        'email',
        'fullName',
        'role',
      ],
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
      isValidPassword,
      loginRequestDtoPassword: loginRequestDto.password,
      userPassword: user.password,
    });

    if (!isValidPassword) {
      console.log('Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createNewRefreshToken(
      user.id.toString(),
      accessToken,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async logout(tokenDto: Tokens): Promise<void> {
    const existingRefreshToken = await this.refreshTokenRepository.findOne({
      where: { refreshToken: tokenDto.refresh_token },
    });
    if (!existingRefreshToken) {
      return;
    }

    const isTokenValid = this.checkValidAccessToken(
      tokenDto.access_token,
      existingRefreshToken.userId,
      existingRefreshToken.jwtTokenId,
    );
    if (!isTokenValid) {
      return;
    }

    await this.markAllTokenInChainAsInvalid(
      existingRefreshToken.userId,
      existingRefreshToken.jwtTokenId,
    );
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

  private checkValidAccessToken(
    accessToken: string,
    expectedUserId: string,
    storedAccessToken: string,
  ): boolean {
    // check body access token vs stored access token
    // check user id in access token vs stored user id
    try {
      const decoded = this.jwtService.verify(accessToken, {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
      });
      return (
        decoded.sub === expectedUserId && accessToken === storedAccessToken
      );
    } catch {
      return false;
    }
  }

  private async markTokenAsInvalid(refreshToken: RefreshToken): Promise<void> {
    refreshToken.isValid = false;
    await this.refreshTokenRepository.save(refreshToken);
  }

  private async markAllTokenInChainAsInvalid(
    userId: string,
    tokenId: string,
  ): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, jwtTokenId: tokenId },
      { isValid: false },
    );
  }

  private async createNewRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<string> {
    const date = new Date();
    const rfDuration = await this.config.get('REFRESH_TOKEN_DURATION');
    if (!rfDuration || isNaN(Number(rfDuration))) {
      throw new ForbiddenException('Secrets not found');
    }
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      jwtTokenId: tokenId,
      refreshToken: `${uuidv4()}-${uuidv4()}`,
      isValid: true,
      expiresAt: new Date(date.getTime() + Number(rfDuration) * 60000),
    });

    await this.refreshTokenRepository.save(refreshToken);
    return refreshToken.refreshToken;
  }

  async refreshAccessToken(tokenDto: Tokens): Promise<Tokens> {
    const existingRefreshToken = await this.refreshTokenRepository.findOne({
      where: { refreshToken: tokenDto.refresh_token },
    });
    if (!existingRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenValid = this.checkValidAccessToken(
      tokenDto.access_token,
      existingRefreshToken.userId,
      existingRefreshToken.jwtTokenId,
    );
    if (!isTokenValid) {
      await this.markTokenAsInvalid(existingRefreshToken);
      throw new UnauthorizedException('Invalid access token');
    }

    if (!existingRefreshToken.isValid) {
      await this.markAllTokenInChainAsInvalid(
        existingRefreshToken.userId,
        existingRefreshToken.jwtTokenId,
      );
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    if (existingRefreshToken.expiresAt < new Date()) {
      await this.markTokenAsInvalid(existingRefreshToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const rfSecret = await this.config.get('REFRESH_TOKEN_SECRET');
    const rfDuration = await this.config.get('REFRESH_TOKEN_DURATION');
    if (!rfSecret || !rfDuration) {
      throw new ForbiddenException('Secrets not found');
    }

    const user1 = await this.userRepo.findOneBy({
      id: existingRefreshToken.userId,
    });
    if (!user1) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const newRefreshToken = await this.createNewRefreshToken(
      existingRefreshToken.userId,
      existingRefreshToken.jwtTokenId,
    );
    await this.markTokenAsInvalid(existingRefreshToken);

    const user = await this.userRepo.findOne({
      where: { id: existingRefreshToken.userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = await this.createAccessToken(user);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  // async updateRtHash(userId: number, rt: string): Promise<void> {
  //   const hash = await argon.hash(rt);
  //   await this.prisma.user.update({
  //     where: {
  //       id: userId,
  //     },
  //     data: {
  //       hashedRt: hash,
  //     },
  //   });
  // }
  private async createAccessToken(user: User): Promise<string> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role.title,
    };

    return await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TOKEN_DURATION'),
    });
  }
}
