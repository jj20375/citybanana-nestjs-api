import { Injectable, Inject, Optional, Logger, HttpStatus, UseInterceptors, UploadedFile, HttpException, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatRealtimeHelperService } from "./chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { ChatFirestoreHelperService } from "./chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { ChatFirestoreService } from "./chat-firestore/chat-firestore.service";
import { ProviderService } from "../../users/provider/provider.service";
import { MemberService } from "../../users/member/member.service";
import { isEmpty } from "src/service/utils.service";
import { RegisterFirebaseDto } from "./dto/registerFirebaseDto.dto";
import { SendProviderDefaultMsgDto } from "./dto/sendProviderDefaultMsg.dto";
import { SendBotDefaultMsgDto } from "./dto/sendBotDefaultMsg.dto";
import { SendBotMsgDto } from "./dto/sendBotMsg.dto";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "src/auth/auth.service";
import moment from "moment";
import { UsersRepository } from "src/users/users.repository";
import { OrderRepository } from "src/order/order.repository";
import { NotificationMessagingService } from "../notification/notification-messaging/notification-messaging.service";
import { sum as _sum } from "lodash/math";
import { ChatRealtimeService } from "./chat-realtime/chat-realtime.service";
@Injectable()
export class ChatsService {
    private serviceChatId: string;
    private phpAPI: string;
    constructor(
        @Inject(forwardRef(() => ConfigService))
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => ChatRealtimeService))
        private readonly chatRealtimeService: ChatRealtimeService,
        private readonly chatRealtimeHelper: ChatRealtimeHelperService,
        private readonly chatFirestoreHelper: ChatFirestoreHelperService,
        @Inject(forwardRef(() => ChatFirestoreService))
        private readonly chatFirestoreService: ChatFirestoreService,
        @Inject(forwardRef(() => ProviderService))
        private readonly providerService: ProviderService,
        private readonly http: HttpService,
        private readonly memberService: MemberService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        @Inject(forwardRef(() => UsersRepository))
        private readonly usersRepository: UsersRepository,
        private readonly orderRepository: OrderRepository,
        private readonly notificationMessagingService: NotificationMessagingService
    ) {
        this.serviceChatId = this.configService.get("chat.serviceChatId");
        this.phpAPI = this.configService.get("host.phpAPI");
    }
    /**
     * 取得歡迎訊息內容
     * @param { type String(字串) } userId
     * @returns
     */
    async getProviderDefaultMessage(userId: string) {
        try {
            const data = await this.providerService.getDataApi(userId);
            if (data.social.welcome_message_enabled !== 0 || !isEmpty(data.social.welcome_message_enabled)) {
                // 判斷是否有設定過歡迎訊息有的話使用自己設定的樣板
                if (isEmpty(data.social.welcome_message)) {
                    // 使用預設的樣板
                    return {
                        message: await this.chatRealtimeHelper.getProviderDefaultMessage(),
                        isEnabledWelcomeMessage: data.social.welcome_message_enabled === 0 ? false : true,
                        providerData: data,
                    };
                } else {
                    // 使用自己設定的樣板
                    return {
                        message: data.social.welcome_message,
                        isEnabledWelcomeMessage: data.social.welcome_message_enabled === 0 ? false : true,
                        providerData: data,
                    };
                }
            } else {
                return {
                    message: data.social.welcome_message,
                    isEnabledWelcomeMessage: data.social.welcome_message_enabled === 0 ? false : true,
                    providerData: data,
                };
            }
        } catch (err) {
            Logger.log("取得服務商訊息樣板失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得服務商訊息樣板失敗",
                    error: {
                        error: "n3002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
            return err;
        }
    }
    /**
     * 發送服務商歡迎訊息
     * @param data
     * @returns
     */
    async sendProviderDefaultMessage(data: SendProviderDefaultMsgDto): Promise<any> {
        /**
         * 2022/09/03 討論不判斷是否為第一次聊天才傳送服務商歡迎訊息
         * 而是開設詢問單時就發送歡迎訊息
         */
        // // 取的聊天訊息比數，判斷是否有大於兩筆
        // const isMessageDataLessThanTwo = await this.chatRealtimeHelper.isMessageDataLessThanTwo(data.loginUserId, data.receiveUserId);
        // // 大於兩筆情況時 不往下執行
        // if (!isMessageDataLessThanTwo) {
        //     return { success: false };
        // }
        const { message, isEnabledWelcomeMessage, providerData } = await this.getProviderDefaultMessage(data.receiveUserId);
        // 判斷服務商關閉發送歡迎訊息時不觸發
        if (!isEnabledWelcomeMessage) {
            return { success: false };
        }
        await this.chatFirestoreService.setUnreadCountAndLastMessage({
            ...data,
            message,
            receiverData: providerData,
        });
        const sendData = { userId: data.receiveUserId, content: message };
        await this.chatRealtimeHelper.sendMessage(sendData, data.loginUserId, data.receiveUserId);
        await this.chatRealtimeHelper.sendMessage(sendData, data.receiveUserId, data.loginUserId);
        return { success: true };
    }
    // 註冊 firebase 資料
    async firebsaeSetUserData(data: RegisterFirebaseDto) {
        const message = await this.chatRealtimeHelper.getRegisterWelcomeMessageSample();
        await this.chatFirestoreService.setUserRomData(data, message);
        // 判斷是否需要發送預設歡迎訊息
        if (data.needSendWelcomeMessage) {
            const sendData = { userId: this.serviceChatId, content: message };
            await this.chatRealtimeHelper.sendMessage(sendData, data.userData.banana_id, this.serviceChatId);
            await this.chatRealtimeHelper.sendMessage(sendData, this.serviceChatId, data.userData.banana_id);
        }
        return { success: true };
    }
    /**
     * 預設機器人發送文字
     * @param { type Boolean(布林) } isProvider 判斷是否為服務商
     * @param { type Object(物件) } userData 使用者資料
     * @param { type String(字串) } userId 登入者 id
     */
    async sendBotDefaultMessage(data: SendBotDefaultMsgDto) {
        // const botMessages = await this.chatRealtimeHelper.getbotAnsewerMessage(data.isProvider);
        let sendData: {
            content: string;
            type: string;
            userId: string;
            link?: string;
            buttons?: [any];
            contentType?: string;
        } = {
            content: data.messageKey === "first" ? this.configService.get("chat.botDefaultMessage") : data.questionText,
            type: "bot",
            userId: data.messageKey === "first" ? this.serviceChatId : data.userId,
        };
        /**
         * 發送第一次歡迎訊息
         */
        await this.chatFirestoreService.setUnreadCountAndLastMessage({
            loginUserId: data.userId,
            receiveUserId: this.serviceChatId,
            // loginUserData: data.userData,
            isProvider: data.isProvider,
            message: sendData.content,
        });
        await this.chatRealtimeHelper.sendMessage(sendData, data.userId, this.serviceChatId);
        await this.chatRealtimeHelper.sendMessage(sendData, this.serviceChatId, data.userId);
        // 預設選中的問題key
        const key = data.messageKey;
        // 預設發送的給予選擇問題資料
        sendData = {
            content: data.botMessages[key].content,
            link: data.botMessages[key].link ?? "",
            buttons: data.botMessages[key].buttons ?? null,
            type: "bot",
            // 用來判斷文案類型 是否需要用連結方式做顯示
            contentType: data.botMessages[key].questionType,
            userId: this.serviceChatId,
        };
        /**
         * 發送第一次歡迎訊息
         */
        await this.chatFirestoreService.setUnreadCountAndLastMessage({
            loginUserId: data.userId,
            receiveUserId: this.serviceChatId,
            // loginUserData: data.userData,
            isProvider: data.isProvider,
            message: sendData.content,
        });
        await this.chatRealtimeHelper.sendMessage(sendData, data.userId, this.serviceChatId);
        await this.chatRealtimeHelper.sendMessage(sendData, this.serviceChatId, data.userId);
        return { success: true };
    }
    /**
     * 發送客服F&Q訊息
     * @param data
     */
    async sendBotMessage(data: SendBotMsgDto) {
        const { isBot } = await this.chatFirestoreHelper.getReceiverData(data.userId, this.serviceChatId);
        // 判斷點擊聯繫客服按鈕時 但以為真人狀態時 不觸發聯繫客服訊息
        if (data.messageKey === "contact" && !isBot) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "已為您聯繫真人客服，請稍候...",
                    error: {
                        error: "n2024",
                        msg: "已為您聯繫真人客服，請稍候...",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        } else {
            await this.sendBotDefaultMessage(data);
        }
        // 判斷選擇聯繫客服按鈕時取為機器人客服時觸發
        if (data.messageKey === "contact" && isBot) {
            await this.chatFirestoreService.setServiceChatToRealAndSendTelegramContact({
                userId: data.userId,
                userName: data.userData.name,
            });
        }
        return { success: true };
    }
    /**
     * 設定聊天對象資料
     * @returns
     */
    async setReceiverRoomData(data: { loginUserId: string; receiveUserId: string; isProvider: boolean }, token?: string) {
        let userData = {};
        if (data.isProvider && data.receiveUserId !== this.serviceChatId) {
            // 取得會員資料
            userData = await this.memberService.getDataApi(data.receiveUserId, token);
        } else if (!data.isProvider && data.receiveUserId !== this.serviceChatId) {
            // 取得服務商資料
            userData = await this.providerService.getDataApi(data.receiveUserId);
        }
        // 判斷是小幫手時 將小幫手資料帶入
        if (data.receiveUserId === this.serviceChatId) {
            userData = this.configService.get("chat.serviceChatData");
        }
        // 新增聊天對象列表資料
        await this.chatFirestoreHelper.setReceiverRoomData(userData, data.loginUserId, data.receiveUserId);
        // 設定聊天對象未讀訊息歸 0
        await this.chatFirestoreHelper.messageReaded(data.loginUserId, data.receiveUserId);
        return { success: true };
    }
    /**
     * 設定服務商聊天對象資料
     */
    async setProviderReceiverRoomData(data: { providerId: string; memberId: string }) {
        const userData = await this.usersRepository.findOne({
            column: "banana_id",
            value: data.providerId,
        });
        const { access_token } = await this.authService.createToken({
            phone: userData.phone,
            userId: userData.id,
        });
        // 取得會員資料
        const memberData = await this.memberService.getDataApi(data.memberId, `Bearer ${access_token}`);
        // 新增聊天對象列表資料
        await this.chatFirestoreHelper.setReceiverRoomData(memberData, data.providerId, data.memberId);
        return { success: true };
    }
    /**
     * 刪除聊天室訊息
     */
    async removeMessages(data: { loginUserId: string; receiveUserId: string }) {
        // 設定 未讀訊息數量 與最後一筆 聊天室內容
        await this.chatFirestoreHelper.setUnreadCountAndLastMessage(0, "", data.loginUserId, data.receiveUserId);
        // 刪除聊天室訊息
        await this.chatRealtimeHelper.removeMessages(data.loginUserId, data.receiveUserId);
        return { success: true };
    }
    /**
     * 緊急聯絡客服發送 telegram 訊息 api
     */
    async contactService(data: { userId: string; userName: string }) {
        await this.chatFirestoreService.setServiceChatToRealAndSendTelegramContact(data);
        await this.chatFirestoreHelper.unReadCountAndLastMessage(
            {
                message: "聯繫真人客服中...",
                lastMsgAt: -moment().valueOf(),
            },
            data.userId,
            this.serviceChatId
        );
        await this.chatFirestoreHelper.unReadCountAndLastMessage(
            {
                message: "聯繫真人客服中...",
                lastMsgAt: -moment().valueOf(),
            },
            this.serviceChatId,
            data.userId
        );
        await this.chatRealtimeHelper.sendMessage(
            {
                content: "聯繫真人客服中...",
                buttons: null,
                type: "bot",
                userId: this.serviceChatId,
            },
            data.userId,
            this.serviceChatId
        );
        await this.chatRealtimeHelper.sendMessage(
            {
                content: "聯繫真人客服中...",
                buttons: null,
                type: "bot",
                userId: this.serviceChatId,
            },
            this.serviceChatId,
            data.userId
        );
        return { success: true };
    }
    /**
     * 發送GPS位置訊息
     */
    async sendGPSLocation(data: { loginUserId: string; receiveUserId: string; message: string; lat: string; long: string; isProvider: boolean }) {
        await this.chatFirestoreService.setUnreadCountAndLastMessage({
            loginUserId: data.loginUserId,
            receiveUserId: data.receiveUserId,
            isProvider: data.isProvider,
            message: "傳送定位訊息",
        });
        const sendData = {
            content: data.message,
            lat: data.lat,
            long: data.long,
            type: "gps",
            userId: data.loginUserId,
        };
        await this.chatRealtimeHelper.sendMessage(sendData, data.loginUserId, data.receiveUserId);
        await this.chatRealtimeHelper.sendMessage(sendData, data.receiveUserId, data.loginUserId);
        return { success: true };
    }

    /**
     * 群發資料
     * @param data
     */
    async sendNoitfyMessages(data: { userIds: [{ banana_id: string; id: string }]; ownerId: number; message: string; token: string; type: string }) {
        const sleep = (milliseconds) => {
            return new Promise((resolve) => setTimeout(resolve, milliseconds));
        };
        const errorDatas = [];
        for (let i = 0; i < data.userIds.length; i++) {
            await sleep(50);
            const sendData: any = {
                content: data.message,
                userId: this.serviceChatId,
                ownerId: data.ownerId,
            };
            // 判斷是圖片時 多傳送 type 值
            if (data.type === "image") {
                sendData.type = "image";
            }
            const sendSelfDown = await this.chatRealtimeHelper.sendMessage(sendData, data.userIds[i].banana_id, this.serviceChatId);
            const sendReceiverDown = await this.chatRealtimeHelper.sendMessage(sendData, this.serviceChatId, data.userIds[i].banana_id);
            if (sendSelfDown.success && sendReceiverDown.success) {
                try {
                    const setDataDown = await this.chatFirestoreService.setUnreadCountAndLastMessageByServiceChatSendNotifyMessage({
                        token: data.token,
                        userId: data.userIds[i].id,
                        loginUserId: data.userIds[i].banana_id,
                        receiveUserId: this.serviceChatId,
                        message: data.message,
                        type: data.type,
                    });
                } catch (err) {
                    console.log(err);
                    errorDatas.push({
                        id: data.userIds[i].id,
                        banana_id: data.userIds[i].banana_id,
                    });
                }
                try {
                    const setDataDown2 = await this.chatFirestoreService.setUnreadCountAndLastMessageByServiceChatSendNotifyMessage({
                        token: data.token,
                        userId: data.userIds[i].id,
                        loginUserId: this.serviceChatId,
                        receiveUserId: data.userIds[i].banana_id,
                        message: data.message,
                        type: data.type,
                    });
                } catch (err) {
                    console.log(err);
                    errorDatas.push({
                        id: data.userIds[i].id,
                        banana_id: data.userIds[i].banana_id,
                    });
                }
            }
        }
        if (errorDatas.length === 0) {
            for (let i = 0; i < data.userIds.length; i++) {
                await sleep(50);
                // 發送 fcm 訊息給聊天對象
                await this.notificationMessagingService.sendToUser({
                    userId: data.userIds[i].banana_id,
                    setData: {
                        title: this.configService.get("chat.serviceChatData.name"),
                        message: data.type === "image" ? "1張圖片" : data.message,
                    },
                    type: "chat",
                    sourceId: data.userIds[i].banana_id,
                    loginUserId: this.serviceChatId,
                });
            }
            return { success: true };
        }
        return {
            success: false,
            errorDatas: errorDatas.filter((data, index, arr) => {
                return arr.indexOf(data) === index;
            }),
        };
    }
    /**
     * 上傳聊天室檔案api
     * @param { type Object(物件) } data { loginUserId: 登入者id, receiveUserId: 聊天對象id, message: 聊天內容 }
     * @param { type File(檔案格式) } file 圖片或其他附件檔案（暫時只限定傳圖片）
     * @param { token String(字串) } token jwt token
     */
    // @UseInterceptors(FileInterceptor("file"))
    async uploadChatImageApi(data: { loginUserId: string; receiveUserId: string }, file, token: string): Promise<any> {
        const headersRequest = {
            Authorization: `${token}`,
            // 設定 header contentType 為表單發送格式
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        };
        // result.append("file", file);
        try {
            // 上傳圖片 api
            const res = await this.http.post(`${this.phpAPI}/chat/attachments`, { file: file.buffer }, { headers: headersRequest }).toPromise();
            // 發送至聊天室資料
            const sendData = {
                userId: data.loginUserId,
                type: "image",
                content: res.data.url,
            };

            await this.chatRealtimeHelper.sendMessage(sendData, data.loginUserId, data.receiveUserId);
            await this.chatRealtimeHelper.sendMessage(sendData, data.receiveUserId, data.loginUserId);
            return { success: true };
        } catch (err) {
            console.log(err);
            return err;
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    msg: "上傳圖片失敗",
                    error: {
                        error: "n4001",
                        msg: err,
                    },
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 判斷是否有聊天記錄與訂單記錄
     * @param data
     */
    async isEmptyOrderAndChats(data: { memberId: string | number; memberBananaId: string; providerBananaId: string }) {
        const provider = await this.usersRepository.findOne({
            column: "banana_id",
            value: data.providerBananaId,
        });
        const isEmptyOrder = await this.orderRepository.isEmptyOrderRecord({
            memberId: data.memberId,
            providerId: provider.id,
        });
        const isEmptyChatsByMember = await this.chatRealtimeHelper.isEmptyMessages(data.memberBananaId, data.providerBananaId);
        const isEmptyChatsByProvider = await this.chatRealtimeHelper.isEmptyMessages(data.memberBananaId, data.providerBananaId);
        if (isEmptyOrder && isEmptyChatsByMember && isEmptyChatsByProvider) {
            return { success: true };
        }
        return { success: false };
    }

    /**
     * 計算未讀訊息總數量
     */
    async countUnreadMessages(data: { userId: string }) {
        let datas = await this.chatFirestoreHelper.getAllReceiverData(data.userId);
        datas = datas.map((item) => item.unReadMessageCount);
        const countUnreadTotal = _sum(datas);
        // 更新聊天對象未讀訊息總計
        await this.chatFirestoreHelper.updateUserUnReadMessageCount(data.userId, countUnreadTotal);
        // 更新登入使用者與客服聊天對象未讀訊息總計
        await this.chatFirestoreHelper.updateUserUnReadMessageCountByServiceChat(data.userId);
        return { success: true, countUnreadTotal };
    }

    /**
     * 傳送開立即刻快閃單訊息至聊天室
     */
    async sendCreateDemandMessageByOrder(data: {
        userData: { name: string };
        loginUserId: string;
        receiveUserId: string;
        message: string;
        isProvider: boolean;
        justSendLoginUser: boolean;
        orderData: any;
        type: string;
    }) {
        const setDataDown = await this.chatFirestoreService.setUnreadCountAndLastMessage(data);
        await this.chatRealtimeHelper.sendMessage(
            { ...data.orderData, type: data.type, userId: data.isProvider ? data.loginUserId : data.receiveUserId },
            data.loginUserId,
            data.receiveUserId
        );
        // 發送訊息至 telegram 客服群
        await this.chatRealtimeService.sendTelegramMsgByServiceRoomMsg({
            userName: data.userData.name,
            userId: data.loginUserId,
            receiveUserId: data.receiveUserId,
            content: data.message,
        });
        if (setDataDown.success) {
            // 發送 fcm 訊息給聊天對象
            await this.notificationMessagingService.sendToUser({
                userId: data.receiveUserId,
                setData: { title: data.userData.name, message: data.message },
                type: "chat",
                sourceId: data.receiveUserId,
                loginUserId: data.loginUserId,
            });
            return { success: true, msg: "發送聊天訊息成功" };
        }
    }
}
