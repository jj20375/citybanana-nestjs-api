import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    ConnectedSocket,
    MessageBody,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsResponse,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { Logger, UseGuards, Req, Headers, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createClient } from "redis";
@WebSocketGateway({
    allowEI03: true,
    // cors: {
    //     origin: "*",
    //     // credentials: true,
    // },
    // path: "/ws",
    // transports: ["websocket"],
})
export class SocketIoGateway {
    // 設定 passport 解析 token 後的 userId 資料
    private userId: number;
    private redisHost: string;
    private redisPort: number;
    private redisChannel: string;
    private redisLogPath: string;
    private jwtService;
    private subscriber;
    constructor(private readonly configService: ConfigService) {
        this.redisHost = this.configService.get("redis.redis_host");
        this.redisPort = this.configService.get("redis.redis_port");
        this.redisChannel = this.configService.get("redis.redis_subscribe_channel");
        this.redisLogPath = this.configService.get("redis.redis_log_path");
        this.jwtService = new JwtService();
        this.subscriber = createClient({ url: `redis://${this.redisHost}:${this.redisPort}` });
    }
    @WebSocketServer() server: Server;

    // 在 socket io 連線成功後要做的事
    async afterInit(server: Server) {}

    // 監聽 socket io 是否有收到 訊息事件 (尚未用到這機制)
    @SubscribeMessage("message")
    public async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: string): Promise<WsResponse<any>> {
        // 取得 token 方法
        const bearerToken = client.handshake.auth.token;
        // 解析 token 資料
        const payload = await this.jwtService.verifyAsync(bearerToken, { secret: this.configService.get("secrets.jwt_secret") });
        // redis 資料
        const logKey = `${this.redisLogPath}-${payload.sub}`;
        // 新增一個 redis client
        const redisLogData = createClient({ url: `redis://${this.redisHost}:${this.redisPort}` });
        // 取得 redis 資料
        redisLogData.get(logKey, (error, result) => {
            if (error) {
                Logger.log(error, "redis log data get error");
                return;
            }
            result = JSON.parse(result);
            // 將收到的字串轉成對應的 category
            const category = data === "read_system" ? "system" : "dating";
            // 設定 讀取狀態為 1 代表已讀
            result[category] = result[category].map((item) => {
                item.status = 1;
                return item;
            });
            // 設定 redis 資料
            redisLogData.set(`${this.redisLogPath}-${payload.sub}`, JSON.stringify(result));
            // socket io 發送 訊息到 client 端
            this.server.to(`${this.redisChannel}-${payload.sub}`).emit("message", JSON.stringify({ result: "success" }));
        });
        return;
    }
    // scoket io 連線前要做的事
    async handleConnection(@ConnectedSocket() client: Socket): Promise<any> {
        // console.log("handleConnection", client.handshake.auth.token);
        if (client.handshake.auth.token === undefined) {
            return;
        }
        // 取得 token 方法
        const bearerToken = client.handshake.auth.token;
        // 解析 token 資料
        const payload = await this.jwtService.verifyAsync(bearerToken, { secret: this.configService.get("secrets.jwt_secret") });
        // set 登入者 id
        this.userId = payload.sub;
        // 設定使用者 socket io 頻道
        client.join(`${this.redisChannel}-${this.userId}`);
        // redis 資料
        const logKey = `${this.redisLogPath}-${payload.sub}`;
        // 新增一個 redis client
        const redisLogData = createClient({ url: `redis://${this.redisHost}:${this.redisPort}` });
        // 取得 redis 資料
        redisLogData.get(logKey, (error, result) => {
            if (error) {
                Logger.log(error, "redis log data get error");
                return;
            }
            // Logger.log(result);
            // 將 redis log 資料 透過 socket io 傳送到前端
            this.server.to(`${this.redisChannel}-${payload.sub}`).emit("message", result);
        });

        // Logger.log(payload);
        Logger.log("socket io 連線成功" + client.id);
        Logger.log(this.server.engine.clientsCount);
    }
    // socket io 斷線時的事件
    handleDisconnect(@ConnectedSocket() client: Socket) {
        Logger.log("socket io 斷線", client.id);
        Logger.log(this.server.engine.clientsCount);
    }
}
