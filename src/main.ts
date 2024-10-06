import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { RedisIoAdapter } from "./adapters/redis.adapter";
import { ConfigService } from "@nestjs/config";
import { AppClusterService } from "./app-cluster/app-cluster.service";
import { Logger, ValidationPipe, HttpStatus, VersioningType } from "@nestjs/common";
import { useContainer } from "class-validator";
import session from "express-session";
import { json, urlencoded } from "express";
// xss 攻擊過濾套件
import helmet from "helmet";
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(json({ limit: "100mb" }));
    app.use(urlencoded({ limit: "50mb", extended: true }));
    app.use(
        helmet({
            // 關閉 透過 ajax 讀取檔案時 Cross-Origin-Resource-Policy 限制問題
            crossOriginResourcePolicy: false,
        })
    );
    app.use(
        session({
            secret: "my-secret",
            resave: false,
            saveUninitialized: false,
        })
    );
    const configService = app.get(ConfigService);
    // 創建 socket io server 與 redis  pub sub 機制
    const redisIoAdapter = new RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();
    // 開啟 socket io server
    app.useWebSocketAdapter(redisIoAdapter);
    // 啟用表單驗證
    app.useGlobalPipes(
        new ValidationPipe({
            // whitelist: true, // 只要傳入非指定 key 時都會被移除
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // https status 回傳 422
            disableErrorMessages: configService.get("NODE_ENV") === "production" ? true : false, // 禁用顯示詳細錯誤 告知哪個欄位錯誤問題
        })
    );
    // Line below needs to be added.
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    // 將 api 路徑加上前綴 (等 app 外包商 全部轉移到有 /api 路徑的時候就可以啟用)
    // app.setGlobalPrefix("api");
    await app.listen(configService.get("PORT") || 3200);
}
// AppClusterService.clusterize(bootstrap);
bootstrap();
