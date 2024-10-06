import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ChatFirestoreService } from "src/firebase/chats/chat-firestore/chat-firestore.service";
import { ChatRealtimeHelperService } from "src/firebase/chats/chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { ChatsService } from "src/firebase/chats/chats.service";
import { VorderFirestoreHelperService } from "./vorder-firestore-helper/vorder-firestore-helper.service";
import moment from "moment";
import { NotificationMessagingService } from "src/firebase/notification/notification-messaging/notification-messaging.service";
import { LoggerService } from "src/logger/logger.service";
import { ChatFirestoreHelperService } from "src/firebase/chats/chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class VorderFirestoreService {
    constructor(
        private readonly vorderFirestoreHelperService: VorderFirestoreHelperService,
        private readonly chatRealtimeHelper: ChatRealtimeHelperService,
        private readonly chatFirestoreService: ChatFirestoreService,
        private readonly chatFirestoreHelper: ChatFirestoreHelperService,
        private readonly chatsService: ChatsService,
        private readonly notificationMessagingService: NotificationMessagingService,
        private readonly configService: ConfigService,
        private readonly loggerService: LoggerService
    ) {}

    /**
     * 設定虛擬訂單並發送訊息至聊天室
     * @param data {
     * {
     * startedAt: 開始時間
     * categoryId: 分類 id
     * duration: 時數
     * district: 會面區域（ex:台北區域）
     * location: 會面地點
     * description: 活動內容
     * memberId: 會員 bananaId
     * providerId: 服務商 bananaId
     * message: 聊天訊息
     * isProvider: 判斷是否為服務商
     * }
     */
    async setVorderAndSendMessage(data: {
        startedAt: Date;
        district: string;
        location: string;
        description: string;
        duration: number;
        memberId: string;
        memberName: string;
        providerId: string;
        message: string;
        isProvider: boolean;
    }) {
        // 設定虛擬單資料
        await this.vorderFirestoreHelperService.setVorder(data);
        /**
         * 發送訂單訊息到聊天室
         */
        const orderData = {
            district: data.district,
            location: data.location,
            description: data.description,
            userId: data.isProvider ? data.providerId : data.memberId,
            type: "vorder",
            startedAt: data.startedAt,
            endedAt: moment(data.startedAt).add(data.duration, "hours").format("YYYY-MM-DD HH:mm"),
        };
        // 判斷有建立過資料的聊天對象不更新彼此的個人資料
        if (
            (await this.chatFirestoreHelper.checkReceiveUserChatRoomEmpty(data.memberId, data.providerId)) ||
            (await this.chatFirestoreHelper.checkReceiveUserChatRoomEmpty(data.providerId, data.memberId))
        ) {
            // 設定服務商聊天對象資料
            await this.chatsService.setProviderReceiverRoomData({
                providerId: data.providerId,
                memberId: data.memberId,
            });
            // 設定會員聊天對象資料
            await this.chatsService.setReceiverRoomData({
                loginUserId: data.memberId,
                receiveUserId: data.providerId,
                isProvider: data.isProvider,
            });
        }
        // 設定最後一筆訊息資料與未讀訊息數量
        await this.chatFirestoreService.setUnreadCountAndLastMessage({
            loginUserId: data.memberId,
            receiveUserId: data.providerId,
            message: data.message,
            isProvider: data.isProvider,
        });
        await this.chatRealtimeHelper.sendMessage(orderData, data.memberId, data.providerId);
        await this.chatRealtimeHelper.sendMessage(orderData, data.providerId, data.memberId);

        /**
         * 發送聊天訊息到聊天室
         */
        const message = {
            content: data.message,
            userId: data.isProvider ? data.providerId : data.memberId,
        };
        await this.chatRealtimeHelper.sendMessage(message, data.memberId, data.providerId);
        await this.chatRealtimeHelper.sendMessage(message, data.providerId, data.memberId);
        // 發送 fcm 詢問單訊息給聊天對象
        await this.notificationMessagingService.sendToUser({
            userId: data.providerId,
            setData: { title: data.memberName, message: "一筆新的預訂諮詢" },
            type: "chat",
            sourceId: data.providerId,
            loginUserId: data.memberId,
        });
        // 發送 fcm 訊息給聊天對象
        await this.notificationMessagingService.sendToUser({
            userId: data.providerId,
            setData: { title: data.memberName, message: data.message },
            type: "chat",
            sourceId: data.providerId,
            loginUserId: data.memberId,
        });
        await this.chatsService.sendProviderDefaultMessage({
            loginUserId: data.memberId,
            receiveUserId: data.providerId,
            isProvider: data.isProvider,
        });
        return { success: true };
    }
    /**
     * 取得虛擬訂單
     */
    async getVorder(data: { loginUserId: string; receiveUserId: string }) {
        const doc = await this.vorderFirestoreHelperService.getVorder(data);
        if (!doc) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "尚未建立虛擬訂單",
                    error: {
                        error: "n8003",
                        msg: "尚未建立虛擬訂單",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        // 判斷當虛擬單開始時間小於當下時間時 刪除虛擬單並返回無虛擬單的錯誤
        if (moment(doc.startedAt).valueOf() < moment().valueOf()) {
            await this.deleteVorder(data);
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "尚未建立虛擬訂單",
                    error: {
                        error: "n8003",
                        msg: "尚未建立虛擬訂單",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        const result = {
            date: moment(doc.startedAt).format("YYYY-MM-DD"),
            time: moment(doc.startedAt).format("HH:mm"),
            district: doc.district,
            location: doc.location,
            description: doc.description,
        };
        return result;
    }
    /**
     * 刪除虛擬單
     */
    async deleteVorder(data: { loginUserId: string; receiveUserId: string }) {
        // 檢查是否有虛擬單存在
        const doc = await this.vorderFirestoreHelperService.getVorder(data);
        if (!doc) {
            return { success: false };
        }
        await this.vorderFirestoreHelperService.deleteVorder(data);
        return { success: true };
    }

    /**
     * 自動回應虛擬單
     */
    async vorderFeedback() {
        // 取得待回覆虛擬單
        const vorders = await this.vorderFirestoreHelperService.getStayResVorders();
        // 自動回應訊息
        const message = this.configService.get("host.systemResponseVorderContent");
        // 判斷是否有未回覆虛擬單
        if (Object.keys(vorders).length > 0) {
            Object.keys(vorders).forEach(async (memberId) => {
                Object.keys(vorders[memberId]).forEach(async (providerId) => {
                    const sendData = {
                        content: message,
                        userId: providerId,
                    };
                    // 設定最後一筆訊息資料與未讀訊息數量
                    await this.chatFirestoreService.setUnreadCountAndLastMessage({
                        loginUserId: providerId,
                        receiveUserId: memberId,
                        message: message,
                        isProvider: true,
                    });
                    this.loggerService.info({
                        type: "詢問單自動回應",
                        providerId,
                        memberId,
                        time: moment().format("YYYY-MM-DD HH:mm:ss"),
                        createdAt: moment(vorders[memberId][providerId].createdAt).format("YYYY-MM-DD HH:mm:ss"),
                    });
                    // 發送訊息
                    await this.chatRealtimeHelper.sendMessage(sendData, providerId, memberId);
                    await this.chatRealtimeHelper.sendMessage(sendData, memberId, providerId);
                    // 更新虛擬單已被系統自動回應過
                    await this.vorderFirestoreHelperService.updateVorderAutoFeedBack({ memberId, providerId });
                    // 判斷是即刻快閃可預訂區域時 才發送
                    if (this.configService.get("order.demandArea").includes(vorders[memberId][providerId].district)) {
                        // 發送開立即刻快閃單訊息
                        await this.chatsService.sendCreateDemandMessageByOrder({
                            userData: { name: memberId },
                            loginUserId: memberId,
                            receiveUserId: providerId,
                            isProvider: false,
                            justSendLoginUser: true,
                            message: "是否開立即刻快閃單",
                            orderData: {
                                startedAt: vorders[memberId][providerId].startedAt, // 預定開始時間
                                description: vorders[memberId][providerId].description, // 活動描述
                            },
                            type: "createDemandByVorder",
                        });
                    }
                });
            });
        }
        return { success: true };
    }

    /**
     * 取得詢問班報表
     */
    async getVorderReport() {
        // 取得待回覆虛擬單
        const vorders = await this.vorderFirestoreHelperService.getVorderReport();
        return vorders;
    }
}
