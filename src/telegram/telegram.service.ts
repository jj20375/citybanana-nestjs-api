import { Injectable } from "@nestjs/common";
import { Telegram } from "telegraf";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class TelegramService {
    bot;
    constructor(private readonly configService: ConfigService) {
        // 新增 telegram 機器人
        this.bot = new Telegram(this.configService.get("telegram.token"), {
            agent: null, // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
            webhookReply: true, // Reply via webhook
        });
    }

    /**
     * 聯繫客服方法
     */
    async contact(data: { userName: string; userId: string }) {
        const message = `${data.userName}_請求聯繫真人客服 \n ${data.userId}`;
        await this.bot.sendMessage(this.configService.get("telegram.serviceGroup"), message);
        process.once("SIGINT", () => this.bot.stop("SIGINT"));
        process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    }
    /**
     * 發送至客服聊天室內容
     */
    async sendServiceRoomMessage(data: { userName: string; userId: string; content: string }) {
        const message = `${data.userName} 發送訊息至聊天室 \n ${data.userId} \n 內容：${data.content}`;
        await this.bot.sendMessage(this.configService.get("telegram.serviceGroup"), message);
        process.once("SIGINT", () => this.bot.stop("SIGINT"));
        process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    }

    /**
     * 送至開發群
     */
    async contactTOPUP(data: { userName: string; amount: any }) {
        const message = `會員「${data.userName}」成功儲值 ${data.amount}元`;
        await this.bot.sendMessage(this.configService.get("telegram.devChat"), message);
        process.once("SIGINT", () => this.bot.stop("SIGINT"));
        process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    }

    /**
     * 開預訂單送至 營運群組
     */
    async isCreateOrder(data: { userName: string; providerName: string; dateStarted: string; dateEnded: string; district: string; location: string; description: string }) {
        const area = this.configService.get(`areas.${data.district}`);
        const message = `新預約單：「${data.userName}」預約「${data.providerName}」時間 ${data.dateStarted} 到 ${data.dateEnded} 在 「${area.name}：${data.location}」活動內容：「${data.description}」`;
        await this.bot.sendMessage(this.configService.get("telegram.businessGroup"), message);
        process.once("SIGINT", () => this.bot.stop("SIGINT"));
        process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    }

    /**
     * 傳送訊息包含黑名單關鍵字時發送至客服聊天室內容
     */
    async sendServiceRoomMessageByBlockKeyword(data: { userName?: string; userId: string; receiveUserId: string; receiveUserName: string; content: string }) {
        const message = `${data.userName}(${data.userId}) 發送訊息至:${data.receiveUserName}(${data.receiveUserId})聊天室 \n  內容包含禁用關鍵詞：${data.content}`;
        await this.bot.sendMessage(this.configService.get("telegram.serviceGroup"), message);
        process.once("SIGINT", () => this.bot.stop("SIGINT"));
        process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    }
}
