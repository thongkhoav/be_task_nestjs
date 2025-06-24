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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RtStrategy = void 0;
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth.service");
let RtStrategy = class RtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    constructor(config, authService) {
        super({
            ignoreExpiration: true,
            passReqToCallback: true,
            secretOrKey: config.get('REFRESH_TOKEN_SECRET'),
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                (request) => {
                    let data = request?.cookies[this.config.get('COOKIE_AUTH', 'Authentication')];
                    if (!data) {
                        return null;
                    }
                    return data.access_token;
                },
            ]),
        });
        this.config = config;
        this.authService = authService;
    }
    async validate(req, payload) {
        if (!payload) {
            throw new common_1.BadRequestException('invalid jwt token');
        }
        let data = req?.cookies[this.config.get('COOKIE_AUTH', 'Authentication')];
        if (!data?.refresh_token) {
            throw new common_1.BadRequestException('invalid refresh token');
        }
        let user = await this.authService.validRefreshToken(payload.email, data.refresh_token);
        if (!user) {
            throw new common_1.BadRequestException('Token expired. Please login');
        }
        return user;
    }
};
exports.RtStrategy = RtStrategy;
exports.RtStrategy = RtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, auth_service_1.AuthService])
], RtStrategy);
//# sourceMappingURL=refresh-token.strategy.js.map