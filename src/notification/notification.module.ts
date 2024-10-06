import { Module, forwardRef } from "@nestjs/common";
import { RedisCacheModule } from "src/redis-cache/redis-cache.module";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { NotificationFirestoreHelperService } from "src/firebase/notification/notification-firestore/notification-firestore-helper/notification-firestore-helper.service";
import { NotificationFirestoreService } from "src/firebase/notification/notification-firestore/notification-firestore.service";
import { NotificationMessagingService } from "src/firebase/notification/notification-messaging/notification-messaging.service";
import { NotificationMessagingHelperService } from "src/firebase/notification/notification-messaging/notification-messaging-helper/notification-messaging-helper.service";
import { UsersModule } from "src/users/users.module";
import { ChatsModule } from "src/firebase/chats/chats.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Agent } from "https";
import { HttpModule } from "@nestjs/axios";
import { LoggerService } from "src/logger/logger.service";
import { QueueService } from "src/firebase/queue/queue.service";
import { ChatFirestoreHelperService } from "src/firebase/chats/chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { ChatRealtimeHelperService } from "src/firebase/chats/chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { PopupFirestoreHelperService } from "src/firebase/popup-firestore/popup-firestore-helper/popup-firestore-helper.service";
import { PopupFirestoreService } from "src/firebase/popup-firestore/popup-firestore.service";
import { TelegramService } from "src/telegram/telegram.service";

@Module({
    imports: [
        forwardRef(() => UsersModule),
        forwardRef(() => ChatsModule),
        RedisCacheModule,
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
        NotificationService,
        NotificationFirestoreHelperService,
        NotificationFirestoreService,
        PopupFirestoreHelperService,
        PopupFirestoreService,
        LoggerService,
        NotificationMessagingHelperService,
        NotificationMessagingService,
        ChatFirestoreHelperService,
        ChatRealtimeHelperService,
        FirebaseInitApp,
        QueueService,
        TelegramService,
    ],
    exports: [
        NotificationService,
        NotificationFirestoreHelperService,
        NotificationFirestoreService,
        LoggerService,
        NotificationMessagingHelperService,
        NotificationMessagingService,
        ChatFirestoreHelperService,
        ChatRealtimeHelperService,
        FirebaseInitApp,
    ],
    controllers: [NotificationController],
})
export class NotificationModule {}
