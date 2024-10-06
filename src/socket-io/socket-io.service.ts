import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { Server } from "socket.io";

@Injectable()
export class SocketIoService {
    constructor(private readonly configService: ConfigService) {}
    subRedis(userId) {
        // 設定redis 訂閱頻道
        const redisKey = `${this.configService.get("redis.redis_subscribe_channel")}-${userId}`;
        console.log(redisKey);
        // Logger.log(redisKey, "redisKey");
        // 新增 redis client
        const subscriber = createClient({
            url: `redis://${this.configService.get("redis.redis_host")}:${this.configService.get("redis.redis_port")}`,
        });
        // 取消訂閱指定頻道事件
        subscriber.unsubscribe(redisKey);
        // 訂閱指定頻道事件
        subscriber.subscribe(redisKey);
        // 監聽指定頻道是否有收到訊息
        subscriber.on("message", async (channel, message) => {
            Logger.log(channel, "channel");
            // 將收到的訊息推播制 前端
            // console.log(message);
            // server.to(channel).emit("message", message);
        });
    }
}
