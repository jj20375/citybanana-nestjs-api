import { Controller, Get, Post, Delete, Res, Req, Body, HttpStatus, UseGuards, HttpException, Param, UseInterceptors, forwardRef, Inject } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ChatFirestoreService } from "./chat-firestore/chat-firestore.service";
import { ChatRealtimeService } from "./chat-realtime/chat-realtime.service";
import { ChatRealtimeHelperService } from "./chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { ChatsService } from "./chats.service";
import { RegisterFirebaseDto } from "./dto/registerFirebaseDto.dto";
import { UnreadCountLastMsg } from "./dto/unreadCountLastMsg.dto";
import { SendChatImageDto } from "./dto/sendChatImage.dto";
import { SendProviderDefaultMsgDto } from "./dto/sendProviderDefaultMsg.dto";
import { SendBotDefaultMsgDto } from "./dto/sendBotDefaultMsg.dto";
import { SendBotMsgDto } from "./dto/sendBotMsg.dto";
import { SetReceiverChatRoomData } from "./dto/setReceiverChatRoomData.dto";
import { UsersService } from "src/users/users.service";
import { RemoveMessagesDto } from "./dto/removeMessagesDto.dto";
import { ContactServiceDto } from "./dto/contactServiceDto.dto";
import { SendGPSLocationDto } from "./dto/sendGPSLocationDto.dto";
import { ConfigService } from "@nestjs/config";
import { SendNotifyMessagesDto } from "./dto/sendNotifyMessagesDto.dto";
import { sendChatMessageDto } from "./dto/sendChatMessageDto";
import { NotificationMessagingService } from "../notification/notification-messaging/notification-messaging.service";
import { UserInterceptor } from "src/users/user.interceptor";
import { MessageProducer } from "./message-queue/message.producer";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { sendServiceChatMessageDto } from "./dto/sendServiceChatMessageDto";
import { sendCityAIMessageDto } from "./dto/sendCityAIMessageDto";
import { UsersRepository } from "src/users/users.repository";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";
import { ChatFirestoreHelperService } from "src/firebase/chats/chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { OrderRepository } from "src/order/order.repository";
import { formatCurrency } from "src/global/helper.service";
import moment from "moment";
import { TelegramService } from "src/telegram/telegram.service";
@Controller("chats")
export class ChatsController {
    private serviceChatId: string;
    constructor(
        private readonly configService: ConfigService,
        private readonly chatFirestoreService: ChatFirestoreService,
        private readonly chatFirestoreHelper: ChatFirestoreHelperService,
        private readonly chatRealtimeService: ChatRealtimeService,
        private readonly chatRealtimeHelper: ChatRealtimeHelperService,
        private readonly chatsService: ChatsService,
        private readonly usersRepository: UsersRepository,
        private readonly usersService: UsersService,
        private readonly notificationMessagingService: NotificationMessagingService,
        private readonly messageProducer: MessageProducer,
        private readonly orderRepository: OrderRepository,
        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,
    ) {
        this.serviceChatId = this.configService.get("chat.serviceChatId");
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("send-chat-message")
    // 計算未讀訊息數量 與 最後一筆聊天內容
    async sendChatMessage(@Body() body: sendChatMessageDto, @Res() res, @Req() req) {
        const sendMessageDown = await this.chatRealtimeService.checkIsBlacklistedAndSendMessage(
            {
                loginUserId: body.loginUserId,
                receiveUserId: body.receiveUserId,
                message: body.message,
                isProvider: body.isProvider,
            },
            req.headers.authorization,
        );
        // 發送訊息至 telegram 客服群
        await this.chatRealtimeService.sendTelegramMsgByServiceRoomMsg({
            userName: req.userData.name,
            userId: body.loginUserId,
            receiveUserId: body.receiveUserId,
            content: body.message,
        });
        const setDataDown = await this.chatFirestoreService.setUnreadCountAndLastMessage(body);
        if (setDataDown.success && sendMessageDown.success) {
            // 判斷是否 有過濾關鍵字成功
            const result: any = await this.chatRealtimeHelper.replaceChatMessageKeywords({
                message: body.message,
            });
            // 判斷有傳送 需過濾關鍵字時 觸發
            if (result.keywordWarning) {
                this.telegramService.sendServiceRoomMessageByBlockKeyword({
                    userName: req.userData.name,
                    userId: body.loginUserId,
                    receiveUserId: body.receiveUserId,
                    receiveUserName: body.receiveUserName,
                    content: body.message,
                });
            }
            // 發送 訊息內容
            const message = result ? result.message : body.message;
            // 發送 fcm 訊息給聊天對象
            await this.notificationMessagingService.sendToUser({
                userId: body.receiveUserId,
                setData: { title: req.userData.name, message: message },
                type: "chat",
                sourceId: body.receiveUserId,
                loginUserId: body.loginUserId,
            });
            return res.status(HttpStatus.CREATED).json({ success: true, msg: "發送聊天訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送聊天訊息失敗",
                error: {
                    error: "n1006",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(AdminAuthGuard)
    @Post("send-service-chat-message")
    // 發送客服聊天室訊息
    async sendServiceChatMessage(@Body() body: sendServiceChatMessageDto, @Res() res, @Req() req) {
        const setDataDown = await this.chatFirestoreService.setServiceChatUnreadCountAndLastMessage(body);
        const sendData = {
            content: body.message,
            userId: this.serviceChatId,
            ownerId: req.user.id,
        };
        await this.chatRealtimeHelper.sendMessage(sendData, this.serviceChatId, body.receiveUserId);
        await this.chatRealtimeHelper.sendMessage(sendData, body.receiveUserId, this.serviceChatId);
        // 發送 fcm 訊息給聊天對象
        await this.notificationMessagingService.sendToUser({
            userId: body.receiveUserId,
            setData: { title: this.configService.get("chat.serviceChatData.name"), message: body.message },
            type: "chat",
            sourceId: body.receiveUserId,
            loginUserId: this.serviceChatId,
        });
        if (setDataDown.success) {
            return res.status(HttpStatus.CREATED).json({ success: true, msg: "發送聊天訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送聊天訊息失敗",
                error: {
                    error: "n1006",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }
    @UseGuards(AdminAuthGuard)
    @Post("send-cityai-chat-message")
    // 發送 CityAI 聊天室訊息
    async sendCityAIChatMessage(@Body() body: sendCityAIMessageDto, @Res() res, @Req() req) {
        const setDataDown = await this.chatFirestoreService.setCityAIChatUnreadCountAndLastMessage(body);
        const sendData = {
            content: body.message,
            userId: body.loginUserId,
            ownerId: req.user.id,
        };
        await this.chatRealtimeHelper.sendMessage(sendData, body.loginUserId, body.receiveUserId);
        await this.chatRealtimeHelper.sendMessage(sendData, body.receiveUserId, body.loginUserId);
        // 發送 fcm 訊息給聊天對象
        const user = await this.usersRepository.findOne({ column: "banana_id", value: body.loginUserId });
        await this.notificationMessagingService.sendToUser({
            userId: body.receiveUserId,
            setData: { title: user.name, message: body.message },
            type: "chat",
            sourceId: body.receiveUserId,
            loginUserId: body.loginUserId,
        });
        if (setDataDown.success) {
            return res.status(HttpStatus.CREATED).json({ success: true, msg: "發送聊天訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送聊天訊息失敗",
                error: {
                    error: "n1006",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("unread-count-last-message")
    // 計算未讀訊息數量 與 最後一筆聊天內容
    async setUnreadCountAndLastMessage(@Body() body: UnreadCountLastMsg, @Res() res) {
        const result = await this.chatFirestoreService.setUnreadCountAndLastMessage(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "更新未讀訊息數量與最後一筆聊天內容成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "更新未讀訊息與最後一筆聊天內容失敗",
                error: {
                    error: "n1001",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
        // Logger.warn(body);
    }

    @UseGuards(JwtAuthGuard)
    @Post("send-provider-default-message")
    // 發送服務商歡迎訊息
    async sendProviderDefaultMessage(@Body() body: SendProviderDefaultMsgDto, @Res() res) {
        const result = await this.chatsService.sendProviderDefaultMessage(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "發送服務商歡迎訊息成功" });
        }
        // 回傳 false 時 代表可能超過一筆聊天資料 或 服務商關閉歡迎訊息發送 所以無需發送歡迎訊息
        if (!result.success) {
            return res.status(HttpStatus.OK).json({ msg: "無需發送歡迎訊息" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送服務商歡迎訊息失敗",
                error: {
                    error: "n1002",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("set-user-chatroom-data")
    // 註冊與登入時 設定 firebase 資料
    async firebsaeSetUserData(@Body() body: RegisterFirebaseDto, @Res() res) {
        const result = await this.chatsService.firebsaeSetUserData(body);
        if (result.success) {
            return res.status(HttpStatus.CREATED).json({ ...result, msg: "設定聊天室資料成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "設定聊天室資料失敗",
                error: {
                    error: "n1003",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("send-bot-default-message")
    // 發送客服機器人預設訊息
    async sendBotDefaultMessage(@Body() body: SendBotDefaultMsgDto, @Res() res) {
        const result = await this.chatsService.sendBotDefaultMessage(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "發送機器人預設訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送機器人預設訊息失敗",
                error: {
                    error: "n1004",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("send-bot-message")
    // 發送客服機器人預設訊息
    async sendBotMessage(@Body() body: SendBotMsgDto, @Res() res) {
        const result = await this.chatsService.sendBotMessage(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "發送機器人訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送機器人訊息失敗",
                error: {
                    error: "n1008",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("send-receiver-chatroom-data")
    // 設定聊天對象聊天室資料
    async setReceiverRoomData(@Body() body: SetReceiverChatRoomData, @Res() res, @Req() req) {
        const result = await this.chatsService.setReceiverRoomData(body, req.headers.authorization);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "設定聊天對象聊天室資料成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "設定聊天對象聊天室資料失敗",
                error: {
                    error: "n1005",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("send-chat-image")
    // 發送聊天室圖片
    async sendChatImage(@Body() body: SendChatImageDto, @Req() req, @Res() res) {
        const { is_blacklisted } = await this.usersService.checkIsBlacklisted(body.receiveUserId, req.headers.authorization);
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
        // 發送至聊天室資料
        const sendData = {
            userId: body.loginUserId,
            type: "image",
            content: body.imageUrl,
        };
        await this.chatRealtimeHelper.sendMessage(sendData, body.loginUserId, body.receiveUserId);
        await this.chatRealtimeHelper.sendMessage(sendData, body.receiveUserId, body.loginUserId);
        // 發送 fcm 訊息給聊天對象
        await this.notificationMessagingService.sendToUser({
            userId: body.receiveUserId,
            setData: { title: req.userData.name, message: "1張圖片" },
            type: "chat",
            sourceId: body.receiveUserId,
            loginUserId: body.loginUserId,
        });
        const sendFirestoreData = {
            loginUserId: body.loginUserId,
            receiveUserId: body.receiveUserId,
            message: body.message,
            isProvider: body.isProvider,
        };
        const setDataDown = await this.chatFirestoreService.setUnreadCountAndLastMessage(sendFirestoreData);
        if (setDataDown.success) {
            return res.status(HttpStatus.CREATED).json({ success: true, msg: "傳送聊天室圖片成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "傳送聊天室圖片失敗",
                error: {
                    error: "n1007",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete("remove-messages/:loginUserId/:receiveUserId")
    // 刪除聊天室資料
    async removeMessages(@Param() params: RemoveMessagesDto, @Res() res) {
        const result = await this.chatsService.removeMessages(params);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "刪除聊天室成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "刪除聊天室失敗",
                error: {
                    error: "n1009",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("contact-service")
    // 聯絡客服
    async contactService(@Body() body: ContactServiceDto, @Res() res) {
        const result = await this.chatsService.contactService(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "聯繫客服成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "聯繫客服失敗",
                error: {
                    error: "n1010",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post("send-gps-location")
    // 發送 GPS 訊息資料
    async sendGPSLocation(@Body() body: SendGPSLocationDto, @Res() res) {
        const result = await this.chatsService.sendGPSLocation({
            loginUserId: body.loginUserId,
            receiveUserId: body.receiveUserId,
            isProvider: body.isProvider,
            message: `${body.lat},${body.long}`,
            lat: body.lat,
            long: body.long,
        });
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "發送GPS定位訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送GPS定位訊息失敗",
                error: {
                    error: "n1011",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(AdminAuthGuard)
    @Post("send-notify-messages")
    async sendNoitfyMessages(@Body() body: SendNotifyMessagesDto, @Res() res) {
        // 發送聊天訊息
        this.messageProducer.sendNotfiyMessage(body);
        return res.status(HttpStatus.OK).json({ msg: "群發成功" });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("empty-order-and-chats")
    // 判斷是否有聊天記錄以及訂單記錄
    async emptyOrderAndChats(@Body() body: { providerId: string }, @Req() req, @Res() res) {
        const result: any = await this.chatsService.isEmptyOrderAndChats({
            memberId: req.userData.id,
            memberBananaId: req.userData.banana_id,
            providerBananaId: body.providerId,
        });
        console.log(result);
        return res.status(HttpStatus.OK).json({ ...result });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("count-unread-messages")
    // 重新統計未讀訊息數量
    async countUnreadMessages(@Res() res, @Req() req) {
        const body = {
            userId: req.userData.banana_id,
        };
        // 計算未讀訊息數量 queue worker
        this.messageProducer.countUnreadMessages(body);
        return res.status(HttpStatus.OK).json({ msg: "重新計算未讀訊息數量" });
    }

    @UseGuards(JwtAuthPHPServerGuard)
    @Post("server/update-all-receiver")
    /**
     * 更新所有聊天對象資料
     */
    async chatRoomReceiverDataUpdate(@Body() body: { userId }, @Res() res) {
        const { success } = await this.chatFirestoreService.chatRoomReceiverDataUpdate({ loginUserId: body.userId });
        return res.status(HttpStatus.OK).json({ success, message: "更新聊天對象資料成功" });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("send-service-chat-message/miss-provider")
    // 服務商確認與會員碰面 但會員卻沒見到服務商時 點擊聯繫客服 發送至客服聊天室訊息
    async sendServiceChatMessageByMissProvider(@Body() body: { orderId: string }, @Res() res, @Req() req) {
        const setDataDown = await this.chatFirestoreService.setServiceChatUnreadCountAndLastMessage({
            receiveUserId: req.userData.banana_id,
            message: "已通知真人客服，等候回應中，如有任何問題可先留下訊息",
        });
        const order: any = await this.orderRepository.getData({ orderId: body.orderId });
        const area = this.configService.get(`areas.${order.district}`);
        const message = `服務商回報已經碰面，但我尚未碰到服務商 \n
        訂單編號：${order.order_id}\n
        會面會員 : ${order.user.name}Marco LAI\n
        開始時間：現在\n
        會面地點：${area.name} | ${order.location}\n
        出席費用：$ ${formatCurrency(order.details.price)}
        `;
        const sendData = {
            content: message,
            userId: req.userData.banana_id,
        };
        // 發送聯繫真人客服字串
        const sendDataByService = {
            type: "contactRealService",
            userId: this.serviceChatId,
        };
        await this.chatRealtimeHelper.sendMessage(sendData, this.serviceChatId, req.userData.banana_id);
        await this.chatRealtimeHelper.sendMessage(sendData, req.userData.banana_id, this.serviceChatId);
        await this.chatRealtimeHelper.sendMessage(sendDataByService, this.serviceChatId, req.userData.banana_id);
        await this.chatRealtimeHelper.sendMessage(sendDataByService, req.userData.banana_id, this.serviceChatId);
        await this.chatFirestoreService.setServiceChatToRealAndSendTelegramContact({ userId: req.userData.banana_id, userName: req.userData.name });
        // // 發送 fcm 訊息給聊天對象
        // await this.notificationMessagingService.sendToUser({
        //     userId: body.receiveUserId,
        //     setData: { title: this.configService.get("chat.serviceChatData.name"), message: message },
        //     type: "chat",
        //     sourceId: body.receiveUserId,
        //     loginUserId: this.serviceChatId,
        // });
        if (setDataDown.success) {
            return res.status(HttpStatus.CREATED).json({ success: true, msg: "發送聊天訊息成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "發送聊天訊息失敗",
                error: {
                    error: "n1006",
                },
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("service-chat-to-bot")
    // 將客服設定為機器人
    async serviceChatToBot(@Res() res, @Req() req) {
        // 將客服設定為機器人
        await this.chatFirestoreHelper.setServiceChatToBot(req.userData.banana_id, this.serviceChatId);
        // 客服的聊天對象設定為機器人
        await this.chatFirestoreHelper.setServiceChatToBot(this.serviceChatId, req.userData.banana_id);
        return res.status(HttpStatus.CREATED).json({ success: true, msg: "更改為機器人客服成功" });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("service-chat-to-real")
    // 將客服設定為真人
    async serviceChatToReal(@Res() res, @Req() req) {
        // 將客服設定為真人
        await this.chatFirestoreHelper.setServiceChatToReal(req.userData.banana_id, this.serviceChatId);
        // 客服的聊天對象設定為真人
        await this.chatFirestoreHelper.setServiceChatToReal(this.serviceChatId, req.userData.banana_id);
        return res.status(HttpStatus.CREATED).json({ success: true, msg: "更改為真人客服成功" });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("contact-service-by-dating")
    // 將客服設定為機器人並發送聯繫客服訊息到連天室
    async contactServiceByDating(@Res() res, @Req() req) {
        // 發送聯繫真人客服字串
        const sendDataByService = {
            type: "contactRealService",
            userId: this.serviceChatId,
        };
        await this.chatRealtimeHelper.sendMessage(sendDataByService, this.serviceChatId, req.userData.banana_id);
        await this.chatRealtimeHelper.sendMessage(sendDataByService, req.userData.banana_id, this.serviceChatId);
        await this.chatFirestoreService.setServiceChatToRealAndSendTelegramContact({ userId: req.userData.banana_id, userName: req.userData.name });

        return res.status(HttpStatus.CREATED).json({ success: true, msg: "已發送聯繫真人客服訊息" });
    }
}
