import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { RedisCacheModule } from "../redis-cache/redis-cache.module";
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./local.strategy";
import { AdminStrategy } from "./admin.strategy";
import { JwtStrategy } from "./jwt.strategy";
import { FacebookStrategy } from "./facebook.strategy";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthSerializer } from "./serialization.provider";
import { JwtService } from "@nestjs/jwt";
import { GoogleOauthService } from "src/users/google/google-oauth.service";
import { googleUsersProviders } from "src/users/google/google-users.providers";
import { GoogleUserRepository } from "src/users/google/google-user.repository";
import { facebookUsersProviders } from "src/users/facebook/facebook-user.providers";
import { FacebookUserRepository } from "src/users/facebook/facebook-user.repository";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { DatabaseModule } from "src/database/database.module";
import { HttpModule } from "@nestjs/axios";
import { Agent } from "https";
import { LoggerService } from "src/logger/logger.service";
import { LineOauthService } from "src/users/line/line-oauth.service";
import { lineUsersProviders } from "src/users/line/line-user.providers";
import { LineUserRepository } from "src/users/line/line-user.repository";
import { AppleOauthService } from "src/users/apple/apple-oauth.service";
import { AppleUserRepository } from "src/users/apple/apple-user.repository";
import { appleUsersProviders } from "src/users/apple/apple-user.providers";
import { AdminModule } from "src/admin/admin.module";
import { ChatsModule } from "src/firebase/chats/chats.module";
import { MitakeSmsService } from "src/sms/mitake-sms/mitake-sms.service";
import { ServerApiController } from "./server-api/server-api.controller";
import { ShortMessageLogsModule } from "src/short-message-logs/short-message-logs.module";
import { PlatformLogsModule } from "src/platform-logs/platform-logs.module";
@Module({
    imports: [
        DatabaseModule,
        AdminModule,
        forwardRef(() => UsersModule),
        RedisCacheModule,
        ShortMessageLogsModule,
        PlatformLogsModule,
        forwardRef(() => ChatsModule),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const secret = config.get("secrets.jwt_secret");
                const jwtExpiredTime = config.get("host.jwtExpiredTime");
                return {
                    secret,
                    signOptions: {
                        expiresIn: jwtExpiredTime,
                    },
                };
            },
        }),
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                httpsAgent: new Agent({ rejectUnauthorized: false }),
                timeout: configService.get("HTTP_TIMEOUT"),
                maxRedirects: configService.get("HTTP_MAX_REDIRECTS"),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        AuthService,
        AdminStrategy,
        LocalStrategy,
        JwtStrategy,
        FacebookStrategy,
        AuthSerializer,
        JwtService,
        GoogleOauthService,
        GoogleUserRepository,
        LineOauthService,
        LineUserRepository,
        FacebookUserRepository,
        AppleOauthService,
        AppleUserRepository,
        TransactionInterceptor,
        LoggerService,
        MitakeSmsService,
        ...googleUsersProviders,
        ...facebookUsersProviders,
        ...lineUsersProviders,
        ...appleUsersProviders,
    ],
    exports: [AuthService, JwtService],
    controllers: [AuthController, ServerApiController],
})
export class AuthModule {}
