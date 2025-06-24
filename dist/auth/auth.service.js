"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require('bcrypt');
const uuid_1 = require("uuid");
const role_entity_1 = require("./entities/role.entity");
const login_session_entity_1 = require("./entities/login-session.entity");
let AuthService = class AuthService {
    constructor(userRepo, roleRepo, loginSessionRepository, jwtService, config, dataSource, entityManager) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.loginSessionRepository = loginSessionRepository;
        this.jwtService = jwtService;
        this.config = config;
        this.dataSource = dataSource;
        this.entityManager = entityManager;
    }
    async isExistEmail(email) {
        const user = await this.userRepo.findOne({ where: { email } });
        return user ? true : false;
    }
    async validateUser(email, pass) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async register(dto) {
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(dto.password, salt);
        const user = new user_entity_1.User({});
        user.email = dto.email;
        user.password = hash;
        user.fullName = dto.fullName;
        let role = await this.roleRepo.findOne({
            where: { title: role_entity_1.RoleType.USER },
        });
        if (!role) {
            role = new role_entity_1.Role({ title: role_entity_1.RoleType.USER });
            await this.roleRepo.save(role);
        }
        user.role = role;
        await this.userRepo.save(user);
    }
    async login(loginRequestDto) {
        const user = await this.userRepo.findOne({
            where: { email: loginRequestDto.email },
            select: ['id', 'password', 'email', 'fullName', 'role'],
            relations: ['role'],
        });
        if (!user) {
            console.log('User not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValidPassword = await bcrypt.compare(loginRequestDto.password, user.password);
        console.log({
            user,
        });
        if (!isValidPassword) {
            console.log('Invalid password');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const accessToken = await this.createAccessToken(user);
        const [refreshToken, refreshTokenExp] = await this.createNewRefreshToken(user.id.toString(), accessToken);
        const newLoginSession = new login_session_entity_1.LoginSession({
            user,
            accessToken,
            refreshToken,
            refreshTokenExp,
        });
        await this.loginSessionRepository.save(newLoginSession);
        return { access_token: accessToken, refresh_token: refreshToken };
    }
    async logout(userId, refreshToken, accessToken) {
        const loginSession = await this.loginSessionRepository.findOne({
            where: { refreshToken, accessToken, user: { id: userId } },
        });
        if (!loginSession) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        await this.loginSessionRepository.softRemove(loginSession);
    }
    async getUserFromToken(token) {
        try {
            const decoded = this.jwtService.verify(token, {
                secret: this.config.get('ACCESS_TOKEN_SECRET'),
            });
            const user = await this.userRepo.findOne({
                where: { id: decoded.sub },
            });
            return user;
        }
        catch {
            return null;
        }
    }
    async getUserById(id) {
        try {
            const user = await this.userRepo.findOne({
                where: { id },
            });
            return user;
        }
        catch {
            return null;
        }
    }
    async createNewRefreshToken(userId, accessToken) {
        const date = new Date();
        const rfDuration = await this.config.get('REFRESH_TOKEN_DURATION');
        if (!rfDuration || isNaN(Number(rfDuration))) {
            throw new common_1.ForbiddenException('Secrets not found');
        }
        const refreshToken = `${(0, uuid_1.v4)()}-${(0, uuid_1.v4)()}`;
        const refreshTokenExp = new Date(date.getTime() + Number(rfDuration) * 60000);
        return [refreshToken, refreshTokenExp];
    }
    async refreshAccessToken(tokenDto) {
        const loginSession = await this.loginSessionRepository.findOne({
            where: {
                refreshToken: tokenDto.refresh_token,
                accessToken: tokenDto.access_token,
            },
            relations: ['user'],
        });
        if (!loginSession) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (new Date(loginSession.refreshTokenExp) < new Date()) {
            await this.loginSessionRepository.softRemove(loginSession);
            throw new common_1.UnauthorizedException('Refresh token has expired. Please login');
        }
        const checkValidAccessToken = loginSession.accessToken === tokenDto.access_token;
        if (!checkValidAccessToken) {
            throw new common_1.UnauthorizedException('Invalid access token');
        }
        const newAccessToken = await this.createAccessToken(loginSession.user);
        const [newRefreshToken, refreshAccessToken] = await this.createNewRefreshToken(loginSession.user.id.toString(), newAccessToken);
        console.log('refresh token', loginSession);
        await this.loginSessionRepository.update(loginSession.id, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            refreshTokenExp: refreshAccessToken,
        });
        return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }
    async validRefreshToken(email, refreshToken) {
        let user = await this.userRepo.findOne({
            where: {
                email: email,
            },
        });
        let loginSession = await this.loginSessionRepository.findOne({
            where: {
                refreshToken: refreshToken,
                user: user,
            },
        });
        if (!loginSession || new Date(loginSession.refreshTokenExp) < new Date()) {
            await this.loginSessionRepository.softRemove(loginSession);
            return null;
        }
        return loginSession;
    }
    async createAccessToken(user) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role.title,
            fullName: user.fullName,
        };
        return await this.jwtService.signAsync(payload, {
            secret: this.config.get('ACCESS_TOKEN_SECRET'),
            expiresIn: this.config.get('ACCESS_TOKEN_DURATION'),
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(login_session_entity_1.LoginSession)),
    __param(6, (0, typeorm_1.InjectEntityManager)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.DataSource,
        typeorm_2.EntityManager])
], AuthService);
//# sourceMappingURL=auth.service.js.map