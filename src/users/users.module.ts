import { Module, forwardRef } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ProviderService } from "./provider/provider.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Agent } from "https";
import { MemberService } from "./member/member.service";
import { UsersController } from "./users.controller";
import { usersProviders } from "./users.providers";
import { UsersRepository } from "./users.repository";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { DatabaseModule } from "src/database/database.module";
import { ChatsModule } from "src/firebase/chats/chats.module";
import { UsersHelperService } from "./users-helper.service";
import { NotificationModule } from "src/notification/notification.module";
import { AuthModule } from "src/auth/auth.module";
import { GoogleOauthService } from "./google/google-oauth.service";
import { LineOauthService } from "./line/line-oauth.service";
import { ActivityModule } from "src/activity/activity.module";
import { JwtService } from "@nestjs/jwt";
import { RegisterProducer } from "./register-queuue/register.producer";
import { BullModule } from "@nestjs/bull";
import { BackyardController } from "./backyard/backyard.controller";
import { LineUserBotController } from "./line/line-user-bot.controller";
import { LineUserRepository } from "./line/line-user.repository";
import { lineUsersProviders } from "src/users/line/line-user.providers";
import { InvitationCodeModule } from "src/invitation-code/invitation-code.module";
import { LoggerService } from "src/logger/logger.service";
@Module({
    imports: [
        ActivityModule,
        NotificationModule,
        InvitationCodeModule,
        forwardRef(() => ChatsModule),
        DatabaseModule,
        forwardRef(() => AuthModule),
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                httpsAgent: new Agent({ rejectUnauthorized: false }),
                timeout: configService.get("HTTP_TIMEOUT"),
                maxRedirects: configService.get("HTTP_MAX_REDIRECTS"),
            }),
            inject: [ConfigService],
        }),
        /**
         * Queue work 模組
         * 執行非同步事件
         */
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                limiter: {
                    max: 10000,
                    duration: 2000,
                },
                redis: {
                    host: configService.get("redis.redis_host"),
                    port: configService.get("redis.redis_port"),
                },
            }),
        }),
        BullModule.registerQueue({ name: "register-queue" }),
    ],
    providers: [
        UsersService,
        ProviderService,
        MemberService,
        ...usersProviders,
        UsersRepository,
        TransactionInterceptor,
        UsersHelperService,
        GoogleOauthService,
        LineOauthService,
        JwtService,
        RegisterProducer,
        ...lineUsersProviders,
        LineUserRepository,
        LoggerService,
    ],
    exports: [
        JwtService,
        UsersService,
        UsersRepository,
        UsersHelperService,
        ...usersProviders,
        ProviderService,
        MemberService,
        RegisterProducer,
        LoggerService,
    ],
    controllers: [UsersController, BackyardController, LineUserBotController],
})
export class UsersModule {}
