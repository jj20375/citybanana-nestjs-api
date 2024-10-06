import { Module } from "@nestjs/common";
import { datingDemandsProviders } from "./dating-demands..providers";
import { BackyardController } from "./backyard/backyard.controller";
import { HttpModule } from "@nestjs/axios";
import { Agent } from "https";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "src/auth/auth.module";
import { DatingDemandsService } from "./dating-demands.service";
import { DemandsBackyardService } from "./backyard/backyard.service";

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                httpsAgent: new Agent({ rejectUnauthorized: false }),
                timeout: configService.get("HTTP_TIMEOUT"),
                maxRedirects: configService.get("HTTP_MAX_REDIRECTS"),
            }),
            inject: [ConfigService],
        }),
        AuthModule,
    ],
    providers: [...datingDemandsProviders, DatingDemandsService, DemandsBackyardService],
    controllers: [BackyardController],
})
export class DatingDemandsModule {}
