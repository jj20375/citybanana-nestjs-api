import { Module, forwardRef } from "@nestjs/common";
import { SocketIoGateway } from "./socket-io.gateway";
import { JwtStrategy } from "../auth/jwt.strategy";
import { UsersService } from "../users/users.service";
import { AuthSerializer } from "../auth/serialization.provider";
import { AuthService } from "../auth/auth.service";
import { MitakeSmsService } from "src/sms/mitake-sms/mitake-sms.service";
import { SocketIoController } from "./socket-io.controller";
import { SocketIoService } from "./socket-io.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "src/users/users.module";
import { RedisCacheModule } from "src/redis-cache/redis-cache.module";
import { ShortMessageLogsModule } from "src/short-message-logs/short-message-logs.module";
import { PlatformLogsModule } from "src/platform-logs/platform-logs.module";
import { Agent } from "https";
@Module({
    imports: [
        RedisCacheModule,
        forwardRef(() => UsersModule),
        ShortMessageLogsModule,
        PlatformLogsModule,
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
    providers: [SocketIoGateway, JwtStrategy, UsersService, AuthSerializer, SocketIoService, AuthService, MitakeSmsService],
    controllers: [SocketIoController],
})
export class SocketIoModule {}
