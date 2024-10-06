import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";

@Injectable()
export class MessageProducer {
    constructor(@InjectQueue("message-queue") private queue: Queue) {}
    /**
     * 發送群發訊息 queue work
     * @param data
     */
    async sendNotfiyMessage(data: any) {
        await this.queue.add("notify-message-job", data, { delay: 1000 });
    }

    /**
     * 計算未讀訊息數量總計
     * @param data
     */
    async countUnreadMessages(data: { userId: string }) {
        await this.queue.add("count-unread-messages-job", data, { delay: 1000 });
    }
}
