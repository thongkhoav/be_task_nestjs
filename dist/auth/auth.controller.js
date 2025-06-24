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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
const login_request_dto_1 = require("./dto/login-request.dto");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let AuthController = class AuthController {
    constructor(authService, jwtService, config) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.config = config;
    }
    async signupLocal(dto) {
        try {
            let isExist = await this.authService.isExistEmail(dto.email);
            if (isExist) {
                throw new common_1.BadRequestException('User with this email already exists');
            }
            await this.authService.register(dto);
            return 'User created';
        }
        catch (error) {
            console.log(error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async signinLocal(res, dto) {
        var tokens = await this.authService.login(dto);
        res.cookie(this.config.get('COOKIE_AUTH', 'Authentication'), tokens, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
        });
        return tokens;
    }
    async logout(req, res, dto) {
        try {
            const curUserId = req?.user?.id;
            if (!curUserId) {
                throw new common_1.BadRequestException('User not found');
            }
            await this.authService.logout(curUserId, dto.refresh_token, dto.access_token);
            res.clearCookie(this.config.get('COOKIE_AUTH', 'Authentication'));
            return 'Logged out';
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async protected(request) {
        try {
            console.log('test protected route ', request.user);
            return 'asasd';
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('signup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupLocal", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('signin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_request_dto_1.LoginRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signinLocal", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('protected'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "protected", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)({ version: '1', path: 'auth' }),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map