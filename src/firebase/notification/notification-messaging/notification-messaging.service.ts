import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { NotificationMessagingHelperService } from "./notification-messaging-helper/notification-messaging-helper.service";
@Injectable()
export class NotificationMessagingService {
    constructor(private notificationMessagingHelperService: NotificationMessagingHelperService) {}
    // 發送 FCM 訊息
    async sendToUser(data: { userId: string; setData: object; type: string; sourceId: string; loginUserId: string }) {
        data.setData = { ...data.setData, type: data.type, sourceId: data.sourceId, userId: data.loginUserId };

        console.log("DEBUG ===>>> data.setData:");
        console.log(data.setData);
        console.log("DEBUG ===>>> data.userId");
        console.log(data.userId);
        await this.notificationMessagingHelperService.sendToUser(data.userId, data.setData);
        return { success: true };
    }
}
