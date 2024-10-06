import { Module, forwardRef } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { ChatRealtimeHelperService } from "src/firebase/chats/chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { VorderFirestoreHelperService } from "src/firebase/vorder/vorder-firestore/vorder-firestore-helper/vorder-firestore-helper.service";
import { VorderFirestoreService } from "src/firebase/vorder/vorder-firestore/vorder-firestore.service";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { ChatFirestoreService } from "src/firebase/chats/chat-firestore/chat-firestore.service";
import { ChatFirestoreHelperService } from "src/firebase/chats/chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { ProviderService } from "src/users/provider/provider.service";
import { AuthService } from "src/auth/auth.service";
import { HttpModule } from "@nestjs/axios";
import { Agent } from "https";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TelegramService } from "src/telegram/telegram.service";
import { JwtService } from "@nestjs/jwt";
import { ChatsService } from "src/firebase/chats/chats.service";
import { MemberService } from "src/users/member/member.service";
import { UsersModule } from "src/users/users.module";
import { OrderHelperService } from "./order-helper/order-helper.service";
import { LoggerService } from "src/logger/logger.service";
import { OrderService } from "./order.service";
import { orderProviders } from "./order.providers";
import { OrderRepository } from "./order.repository";
import { ChatsModule } from "src/firebase/chats/chats.module";
import { RedisCacheModule } from "src/redis-cache/redis-cache.module";
import { MitakeSmsService } from "src/sms/mitake-sms/mitake-sms.service";
import { ShortMessageLogsModule } from "src/short-message-logs/short-message-logs.module";
import { PlatformLogsModule } from "src/platform-logs/platform-logs.module";
import { OrderEventProducer } from "./events/order-event.producer";
import { OrderEventConsumer } from "./events/order-event.consumer";
import { OrderExtensionsModule } from "./order-extensions/order-extensions.module";
import { VouchersModule } from "src/vouchers/vouchers.module";
import { VoucherLogsModule } from "src/voucher-logs/voucher-logs.module";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { DatabaseModule } from "src/database/database.module";
import { TransactionLogsModule } from "src/transaction-logs/transaction-logs.module";
import { NotificationModule } from "src/notification/notification.module";
import { OrderServerApiController } from "./server-api/server-api.controller";
import { MitakeSmsModule } from "src/sms/mitake-sms/mitake-sms.module";
import { BackyardController } from "./backyard/backyard.controller";
import { OrderBackyardService } from "./backyard/backyard.service";
import { AuthModule } from "src/auth/auth.module";
@Module({
    imports: [
        NotificationModule,
        RedisCacheModule,
        ShortMessageLogsModule,
        PlatformLogsModule,
        VouchersModule,
        VoucherLogsModule,
        TransactionLogsModule,
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
        forwardRef(() => ChatsModule),
        MitakeSmsModule,
        OrderExtensionsModule,
        DatabaseModule,
        AuthModule,
    ],
    providers: [
        VorderFirestoreHelperService,
        VorderFirestoreService,
        FirebaseInitApp,
        ChatRealtimeHelperService,
        ChatFirestoreService,
        ChatFirestoreHelperService,
        ChatsService,
        AuthService,
        TelegramService,
        JwtService,
        // OrderHelperService,
        MitakeSmsService,
        OrderService,
        ...orderProviders,
        OrderRepository,
        LoggerService,
        OrderEventProducer,
        OrderEventConsumer,
        TransactionInterceptor,
        OrderBackyardService,
    ],
    exports: [VorderFirestoreHelperService, VorderFirestoreService],
    controllers: [OrderController, OrderServerApiController, BackyardController],
})
export class OrderModule {}
