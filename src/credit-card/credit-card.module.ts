import { Module } from "@nestjs/common";
import { CreditCardService } from "src/credit-card/credit-card.service";
import { UsersModule } from "src/users/users.module";
import { TransactionLogsModule } from "src/transaction-logs/transaction-logs.module";
import { PlatformLogsModule } from "src/platform-logs/platform-logs.module";
import { CreditCardController } from "src/credit-card/credit-card.controller";
import { creditCardProviders } from "src/credit-card/credit-card.providers";
import { NewebpayModule } from "src/payments/newebpay/newebpay.module";
import { NotificationModule } from "src/notification/notification.module";
import { PaymentsModule } from "src/payments/payments.module";
import { TelegramService } from "src/telegram/telegram.service";
import { JwtService } from "@nestjs/jwt";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Agent } from "https";

@Module({
    imports: [
        PaymentsModule,
        NotificationModule,
        TransactionLogsModule,
        PlatformLogsModule,
        UsersModule,
        NewebpayModule,
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
    providers: [TelegramService, CreditCardService, ...creditCardProviders, JwtService, ...creditCardProviders],
    exports: [...creditCardProviders],
    controllers: [CreditCardController],
})
export class CreditCardModule {}
