import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from "@nestjs/common";
import { ChatRealtimeHelperService } from "./chat-realtime-helper/chat-realtime-helper.service";
import { UsersService } from "src/users/users.service";
import { TelegramService } from "src/telegram/telegram.service";
import { VorderFirestoreHelperService } from "src/firebase/vorder/vorder-firestore/vorder-firestore-helper/vorder-firestore-helper.service";
@Injectable()
export class ChatRealtimeService {
    constructor(
        private readonly chatRealtimeHelper: ChatRealtimeHelperService,
        private readonly usersService: UsersService,
        private readonly telegramService: TelegramService,
        private readonly vorderFristoreHelper: VorderFirestoreHelperService,
    ) {}
    /**
     * 判斷是否為黑名單 並發送聊天訊息
     */
    async checkIsBlacklistedAndSendMessage(data: { loginUserId: string; receiveUserId: string; message: string; isProvider: boolean }, token: string) {
        const { is_blacklisted } = await this.usersService.checkIsBlacklisted(data.receiveUserId, token);
        if (is_blacklisted) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "已被列為黑名單",
                    error: {
                        error: "n3005",
                        msg: "已被封鎖",
                    },
                },
                HttpStatus.FORBIDDEN,
            );
        }
        const sendData = {
            content: data.message,
            userId: data.loginUserId,
        };
        // 判斷服務商回應訊息時觸發
        if (data.isProvider) {
            // 取得聊天對象是否有虛擬單
            const vorder = await this.vorderFristoreHelper.getVorder({ loginUserId: data.receiveUserId, receiveUserId: data.loginUserId });
            // 判斷是否有虛擬單
            if (vorder) {
                // 判斷有服務商未回覆虛擬單時觸發
                if (vorder.isProviderRes !== undefined && vorder.isProviderRes === 0) {
                    // 更新服務商回覆虛擬單狀態
                    await this.vorderFristoreHelper.updateVorderProviderFeedBack({ memberId: data.receiveUserId, providerId: data.loginUserId });
                }
            }
        }

        await this.chatRealtimeHelper.sendMessage(sendData, data.loginUserId, data.receiveUserId);
        await this.chatRealtimeHelper.sendMessage(sendData, data.receiveUserId, data.loginUserId);

        return { success: true };
    }

    /**
     * 判斷與客服聊天室時 是否發訊息到 telegram
     */
    async sendTelegramMsgByServiceRoomMsg(data: { userName: string; userId: string; receiveUserId: string; content: string }) {
        // 判斷聊天對象為客服時
        if (data.receiveUserId === this.chatRealtimeHelper.serviceChatId) {
            // 當聊天對象為客服時 判斷是否發送訊息至 telegram
            if (await this.chatRealtimeHelper.isServiceRoomSendTelegramMessage()) {
                this.telegramService.sendServiceRoomMessage({ userName: data.userName, userId: data.userId, content: data.content });
            }
        }
    }
}
