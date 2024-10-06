import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatsModule } from "./firebase/chats/chats.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SocketIoModule } from "./socket-io/socket-io.module";
import { SocketIoGateway } from "./socket-io/socket-io.gateway";
import { ThrottlerModule } from "@nestjs/throttler";
import { TelegramModule } from "./telegram/telegram.module";
import { NotificationModule } from "./notification/notification.module";
import Configuration from "./config/configuration";
import SecretConfig from "./config/secret.config";
import RedisConfig from "./config/redis.config";
import SocketConfig from "./config/socket.config";
import ChatConfig from "./config/chat.config";
import MitakeSMSConfig from "./config/sms/mitake.config";
import SqldbConfig from "./config/database.config";
import TelegramConfig from "./config/telegram.config";
import SocialOauthConfig from "./config/socialOauth.config";
import HostConfig from "./config/host.config";
import OrderConfig from "./config/order.config";
import AreasConfig from "./config/areas.config";
import { WinstonModule } from "nest-winston";
import { LoggerService } from "./logger/logger.service";
import { DatabaseModule } from "./database/database.module";
import { OrderModule } from "./order/order.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "path";
import * as winston from "winston";
import { RewriteApiEndpointMiddleware } from "./middleware/rewriteApiEndpoint.middleware";
import { AdminModule } from "./admin/admin.module";
import { GoogleMapController } from "./google-map/google-map.controller";
import { GoogleMapService } from "./google-map/google-map.service";
import { GoogleMapModule } from "./google-map/google-map.module";
import { ActivityModule } from "./activity/activity.module";
import { AuthenticationModule } from "./authentication/authentication.module";
import { ReportController } from "./report/report.controller";
import { ReportService } from "./report/report.service";
import { ReportModule } from "./report/report.module";
import { NewebpayModule } from "./payments/newebpay/newebpay.module";
import { PaymentsModule } from "./payments/payments.module";
import { CreditCardModule } from "./credit-card/credit-card.module";
import { TransactionLogsModule } from "./transaction-logs/transaction-logs.module";
import { PlatformLogsModule } from "./platform-logs/platform-logs.module";
import { CronService } from "./cron/cron.service";
import { ScheduleModule } from "@nestjs/schedule";
import { MitakeSmsModule } from "./sms/mitake-sms/mitake-sms.module";
import { ShortMessageLogsModule } from "./short-message-logs/short-message-logs.module";
// event 事件 模組
import { EventEmitterModule } from "@nestjs/event-emitter";
import { BlacklistModule } from "./blacklist/blacklist.module";
import { CategoriesModule } from "./categories/categories.module";
import { BusinessHoursModule } from "./business/business-hours/business-hours.module";
import { NonBusinessHoursModule } from "./business/non-business-hours/non-business-hours.module";
import { WeeklyBusinessHoursModule } from "./business/weekly-business-hours/weekly-business-hours.module";
import { DatingDemandsModule } from "./demands/dating-demands/dating-demands.module";
import { DatingDemandsEnrollersModule } from "./demands/dating-demands-enrollers/dating-demands-enrollers.module";
import { VoucherLogsModule } from "./voucher-logs/voucher-logs.module";
import { VouchersModule } from "./vouchers/vouchers.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { ClientSettingController } from "./client-setting/client-setting.controller";
import { ClientSettingService } from "./client-setting/client-setting.service";
import { ClientSettingModule } from "./client-setting/client-setting.module";
import { ClientUiSettingService } from "./firebase/client-ui-setting/client-ui-setting.service";
import { InvitationCodeModule } from "./invitation-code/invitation-code.module";
import { PromotersModule } from "./promoters/promoters.module";
import { NotificationController } from "./firebase/notification/notification.controller";
import { PopupFirestoreHelperService } from "./firebase/popup-firestore/popup-firestore-helper/popup-firestore-helper.service";

const errorLogPath = path.resolve(process.cwd(), "./logs", `error.log`);
const infoLogPath = path.resolve(process.cwd(), "./logs", `info.log`);
const httpPath = path.resolve(process.cwd(), "./logs", `http.log`);
@Module({
    imports: [
        // event 事件模組
        EventEmitterModule.forRoot({
            // set this to `true` to use wildcards
            wildcard: false,
            // the delimiter used to segment namespaces
            delimiter: ".",
            // set this to `true` if you want to emit the newListener event
            newListener: false,
            // set this to `true` if you want to emit the removeListener event
            removeListener: false,
            // the maximum amount of listeners that can be assigned to an event
            maxListeners: 10,
            // show event name in memory leak message when more than maximum amount of listeners is assigned
            verboseMemoryLeak: false,
            // disable throwing uncaughtException if an error event is emitted and it has no listeners
            ignoreErrors: false,
        }),
        ScheduleModule.forRoot(),
        // 設定本地圖片檔案可以對外公開
        ServeStaticModule.forRoot({
            rootPath: path.join(__dirname, "..", "static"),
            // 忽略帶有 /api 開頭前綴 (怕與 api 衝突)
            exclude: ["/api*"],
        }),
        ConfigModule.forRoot({
            envFilePath: [".env", ".env.development.local"],
            load: [Configuration, SecretConfig, RedisConfig, SocketConfig, ChatConfig, TelegramConfig, SqldbConfig, SocialOauthConfig, HostConfig, MitakeSMSConfig, , OrderConfig, AreasConfig],
            expandVariables: true, // 開啟環境變數檔變數嵌入功能
            isGlobal: true,
        }),
        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 1000,
        }),
        WinstonModule.forRootAsync({
            useFactory: () => ({
                transports: [
                    new winston.transports.File({
                        format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
                        filename: errorLogPath,
                        level: "error",
                        maxsize: 5 * 1024 * 1024,
                        maxFiles: 3,
                    }),
                    new winston.transports.File({
                        format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
                        filename: infoLogPath,
                        level: "info",
                        maxsize: 5 * 1024 * 1024,
                        maxFiles: 3,
                    }),
                    new winston.transports.File({
                        format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
                        filename: httpPath,
                        level: "http",
                        maxsize: 5 * 1024 * 1024,
                        maxFiles: 3,
                    }),
                ],
            }),
            inject: [],
        }),
        ChatsModule,
        AuthModule,
        UsersModule,
        SocketIoModule,
        TelegramModule,
        NotificationModule,
        DatabaseModule,
        OrderModule,
        AdminModule,
        ReportModule,
        GoogleMapModule,
        ActivityModule,
        AuthenticationModule,
        NewebpayModule,
        PaymentsModule,
        CreditCardModule,
        TransactionLogsModule,
        PlatformLogsModule,
        MitakeSmsModule,
        ShortMessageLogsModule,
        ClientSettingModule,
        BlacklistModule,
        CategoriesModule,
        BusinessHoursModule,
        NonBusinessHoursModule,
        WeeklyBusinessHoursModule,
        DatingDemandsModule,
        DatingDemandsEnrollersModule,
        VoucherLogsModule,
        VouchersModule,
        CampaignsModule,
        InvitationCodeModule,
        PromotersModule,
    ],
    controllers: [AppController, ReportController, NotificationController, ClientSettingController],
    providers: [AppService, SocketIoGateway, LoggerService, ReportService, CronService, ClientSettingService, ClientUiSettingService, PopupFirestoreHelperService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // 將 api 請求透過轉址方式 讓 有 /api 開頭的 api 跟現有 api 共存（等全部轉移到 /api的時候需移除)
        consumer.apply(RewriteApiEndpointMiddleware).forRoutes("/");
    }
}
