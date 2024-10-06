import { Module, forwardRef } from "@nestjs/common";
import { NewebpayService } from "./newebpay.service";
import { NewebpayController } from "./newebpay.controller";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Agent } from "https";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [
        forwardRef(() => UsersModule),
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
    providers: [NewebpayService],
    controllers: [NewebpayController],
    exports: [NewebpayService],
})
export class NewebpayModule {}
