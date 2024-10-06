import { CacheModule, Module, Logger } from "@nestjs/common";
import { RedisCacheService } from "./redis-cache.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MESSAGE_EVENT } from "@nestjs/microservices/constants";
import { RedisCacheController } from "./redis-cache.controller";
import * as redisStore from "cache-manager-redis-store";

@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: redisStore,
                host: configService.get("redis.redis_host"),
                port: configService.get("redis.redis_port"),
                // ttl: configService.get("CACHE_TTL"),
                // ttl: 0,
                max: configService.get("MAX_ITEM_IN_CACHE"),
            }),
        }),
    ],
    providers: [RedisCacheService],
    exports: [RedisCacheService],
    controllers: [RedisCacheController],
})
export class RedisCacheModule {
    constructor(private configService: ConfigService) {}
}
