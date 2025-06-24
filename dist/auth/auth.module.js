"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const strategies_1 = require("./strategies");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const user_room_entity_1 = require("./entities/user-room.entity");
const role_entity_1 = require("./entities/role.entity");
const login_session_entity_1 = require("./entities/login-session.entity");
const notification_entity_1 = require("../notification/entities/notification.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secretOrPrivateKey: process.env.ACCESS_TOKEN_SECRET,
                signOptions: { expiresIn: '7d' },
            }),
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                user_room_entity_1.UserRoom,
                role_entity_1.Role,
                notification_entity_1.Notification,
                login_session_entity_1.LoginSession,
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [strategies_1.RtStrategy, strategies_1.JwtStrategy, auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map