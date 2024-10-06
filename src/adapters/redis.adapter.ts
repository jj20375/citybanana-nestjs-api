import { IoAdapter } from "@nestjs/platform-socket.io";
import { ConfigService } from "@nestjs/config";
import { ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import cluster from "cluster";
import { Logger } from "@nestjs/common";
import passport from "passport";
export class RedisIoAdapter extends IoAdapter {
    protected authSerializer;
    // 訂閱 redis channel
    protected redisSubscriber;
    private redisHost: string;
    private redisPort: number;
    constructor(app, private readonly configService: ConfigService) {
        super(app);
        this.redisHost = this.configService.get("redis.redis_host");
        this.redisPort = this.configService.get("redis.redis_port");
        this.redisSubscriber = createClient({ url: `redis://${this.redisHost}:${this.redisPort}` });
    }
    private adapterConstructor: ReturnType<typeof createAdapter>;
    async connectToRedis(): Promise<void> {
        const pubClient = createClient({
            url: `redis://${this.redisHost}:${this.redisPort}`,
        });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient, subClient]);
        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: ServerOptions): any {
        // console.log(cluster.isMaster);
        const server = super.createIOServer(this.configService.get("socket.socketio_port"), options);
        // const server = super.createIOServer("350" + process.env.NODE_APP_INSTANCE, options);
        server.adapter(this.adapterConstructor);
        // 判斷是否有 jwt token 沒有的使用者不能連線 socket io
        const authenticatedSocket = (req, res, next) => {
            passport.authenticate("jwt", { session: false }, (err, user) => {
                if (!user) {
                    console.log("Permission is denied", user);
                    return next("Permission is denied");
                }
                const redisKey = `${this.configService.get("redis.redis_subscribe_channel")}-${user.userId}`;
                this.redisSubscriber.subscribe(redisKey, (err, channel) => {
                    if (err) console.error(err.message);
                    // console.log(`Subscribed to ${channel} channels.`);
                });
                req.user = user; //看你要把什麼資料包進去往下
                return next();
            })(req, res, next); //passport custom的包法請自行看官網囉
        };
        const wrapMiddlewareForSocketIo = (middleware) => {
            return (socket, next) => {
                return middleware(socket.request, {}, next);
            };
        };
        server.use(wrapMiddlewareForSocketIo(authenticatedSocket));
        this.listeningRedisChannel(server);
        return server;
    }
    // 監聽redis 是否有收到訊息
    listeningRedisChannel(server) {
        // 監聽指定頻道是否有收到訊息
        this.redisSubscriber.on("message", async (channel, message) => {
            server.to(channel).emit("message", message);
        });
    }
}
