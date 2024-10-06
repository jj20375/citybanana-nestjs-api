import { registerAs } from "@nestjs/config";

export default registerAs("chat", () => ({
    serviceChatId: process.env.SERVICE_CHAT_ID,
    serviceChatData: {
        banana_id: process.env.SERVICE_CHAT_ID,
        name: process.env.SERVICE_CHAT_NAME,
        avatar: "",
        type: "citybanana_service",
    },
    botDefaultMessage: process.env.BOT_DEFAULT_MESSAGE,
}));
