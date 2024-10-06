import { Module } from "@nestjs/common";
import { MitakeSmsService } from "./mitake-sms.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { Agent } from "https";
import { MitakeSmsController } from "./mitake-sms.controller";
import { AuthModule } from "src/auth/auth.module";
@Module({
    imports: [
        AuthModule,
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
    providers: [MitakeSmsService],
    exports: [MitakeSmsService],
    controllers: [MitakeSmsController],
})
export class MitakeSmsModule {}
