import { Module, forwardRef } from "@nestjs/common";
import { ChatFirestoreService } from "./chat-firestore/chat-firestore.service";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { ChatsController } from "./chats.controller";
import { ChatFirestoreHelperService } from "./chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Agent } from "https";
import { ChatRealtimeHelperService } from "./chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { ChatRealtimeService } from "./chat-realtime/chat-realtime.service";
import { ChatsService } from "./chats.service";
import { ProviderService } from "src/users/provider/provider.service";
import { MemberService } from "src/users/member/member.service";
import { UsersService } from "src/users/users.service";
import { TelegramService } from "src/telegram/telegram.service";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";
import { NotificationMessagingService } from "src/firebase/notification/notification-messaging/notification-messaging.service";
import { NotificationMessagingHelperService } from "src/firebase/notification/notification-messaging/notification-messaging-helper/notification-messaging-helper.service";
import { LoggerService } from "src/logger/logger.service";
import { orderProviders } from "src/order/order.providers";
import { OrderRepository } from "src/order/order.repository";
import { NotificationFirestoreHelperService } from "../notification/notification-firestore/notification-firestore-helper/notification-firestore-helper.service";
import { MessageProducer } from "./message-queue/message.producer";
import { MessageConsumer } from "./message-queue/message.consumer";
import { BullModule } from "@nestjs/bull";
import { VorderFirestoreHelperService } from "src/firebase/vorder/vorder-firestore/vorder-firestore-helper/vorder-firestore-helper.service";
@Module({
    imports: [
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
        BullModule.registerQueue({ name: "message-queue" }),
        forwardRef(() => AuthModule),
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
    providers: [
        ChatFirestoreService,
        FirebaseInitApp,
        ChatFirestoreHelperService,
        ChatRealtimeHelperService,
        ChatRealtimeService,
        ChatsService,
        UsersService,
        ConfigService,
        TelegramService,
        NotificationMessagingHelperService,
        NotificationMessagingService,
        LoggerService,
        OrderRepository,
        NotificationFirestoreHelperService,
        ...orderProviders,
        MessageProducer,
        MessageConsumer,
        VorderFirestoreHelperService,
    ],
    exports: [
        ChatsService,
        UsersService,
        ChatFirestoreService,
        FirebaseInitApp,
        ChatFirestoreHelperService,
        ChatRealtimeHelperService,
        ChatRealtimeService,
        NotificationMessagingHelperService,
        NotificationMessagingService,
    ],
    controllers: [ChatsController],
})
export class ChatsModule {}
