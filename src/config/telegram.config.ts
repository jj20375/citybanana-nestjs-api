import { registerAs } from "@nestjs/config";

export default registerAs("telegram", () => ({
    token: process.env.TELEGRAM_BOT_TOKEN,
    serviceGroup: process.env.TELEGRAM_SERVICE_CHAT_ID,
    bugGroup: process.env.TELEGRAM_BUG_CHAT_ID,
    systemWatchGroup: process.env.TELEGRAM_WATCH_CHAT_ID,
    devChat: process.env.TELEGRAM_FIN_CHAT_ID,
    businessGroup: process.env.TELEGRAM_BUSINESS_CHAT_ID,
}));
