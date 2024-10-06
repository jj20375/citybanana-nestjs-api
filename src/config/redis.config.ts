import { registerAs } from "@nestjs/config";

export default registerAs("redis", () => ({
    redis_host: process.env.REDIS_HOST,
    redis_port: process.env.REDIS_PORT,
    redis_subscribe_channel: process.env.REDIS_SUBSCRIBE_CHANNEL,
    redis_log_path: process.env.REDIS_LOG_PATH,
}));
