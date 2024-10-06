import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { ChatsService } from "../chats.service";

@Processor("message-queue")
export class MessageConsumer {
    constructor(private chatsService: ChatsService) {}
    /**
     * 群發訊息 queue work
     */
    @Process("notify-message-job")
    async sendNotifyMessage(job: Job<unknown>) {
        const data: any = job.data;
        await this.chatsService.sendNoitfyMessages(data);
    }

    /**
     * 計算未讀訊息數量總計
     */
    @Process("count-unread-messages-job")
    async countUnreadMessages(job: Job<{ userId: string; isProvider: boolean }>) {
        const data = job.data;
        await this.chatsService.countUnreadMessages(data);
    }
}
