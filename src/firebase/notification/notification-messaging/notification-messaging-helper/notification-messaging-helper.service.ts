import { Injectable, Logger, HttpException, HttpStatus, Inject, forwardRef } from "@nestjs/common";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { UserDevice } from "src/users/user-device.entity";
import { User } from "src/users/user.entity";
import { LoggerService } from "src/logger/logger.service";
import { UsersRepository } from "src/users/users.repository";
import { NotificationFirestoreHelperService } from "../../notification-firestore/notification-firestore-helper/notification-firestore-helper.service";
import { ChatFirestoreHelperService } from "src/firebase/chats/chat-firestore/chat-firestore-helper/chat-firestore-helper.service";
import { ConfigService } from "@nestjs/config";
import { defaultsDeep as _defaultsDeep } from "lodash/object";
import { isEmpty } from "src/service/utils.service";
@Injectable()
export class NotificationMessagingHelperService {
    private messaging;
    constructor(
        private firbaseInitApp: FirebaseInitApp,
        @Inject(forwardRef(() => UsersRepository))
        private readonly usersRepository: UsersRepository,
        private loggerService: LoggerService,
        private notHelperService: NotificationFirestoreHelperService,
        private readonly chatFirestoreHelper: ChatFirestoreHelperService,
        private readonly configService: ConfigService,
    ) {
        this.messaging = this.firbaseInitApp.firebaseMessaging();
    }

    /**
     * 將物件資料超過二維物件的轉成一維物件方法
     * @param o
     * @returns
     */
    async toString(o: object | null | undefined) {
        if (o === null || o === undefined) {
            return o;
        }
        Object.keys(o).forEach((k) => {
            if (typeof o[k] === "object") {
                return this.toString(o[k]);
            }
            o[k] = "" + o[k];
        });
        return o;
    }

    /**
     * 發送 FCM 訊息
     * @param { type String(字串) } userId  使用者id
     */
    async sendToUser(userId: string, data) {
        console.log("DEBUG ===>>> userId: " + userId);
        console.log("DEBUG ===>>> data:");
        console.log(data);

        const user: any = await this.usersRepository.findOne({ column: "banana_id", value: userId });
        const userUnReadServiceMessageCount: number = await this.chatFirestoreHelper.getUserByServiceChatUnReadMessageCount(userId);
        const userUnReadMessageCount: number = await this.chatFirestoreHelper.getUserUnReadMessageCount(userId);
        const userUnReadNotificationCount: number = await this.notHelperService.getNotificationUnReadCount(userId);
        if (isEmpty(user) === null || isEmpty(user.user_devices)) {
            this.loggerService.error({
                title: "沒有使用者或沒有 device token",
                userId,
            });
            return { success: false };
        }
        // 判斷聊天對象是客服時不用發送 fcm
        if (userId === this.configService.get("chat.serviceChatId")) {
            this.loggerService.error({
                title: "客服 user",
                userId,
            });

            return { success: false };
        }

        console.log("DEBUG ===>>> data.message: " + userId);
        console.log(data.message.replace(/(<([^>]+)>)/gi, ""));
        console.log("DEBUG ===>>> userUnReadServiceMessageCount: " + userUnReadServiceMessageCount);
        console.log("DEBUG ===>>> userUnReadMessageCount: " + userUnReadMessageCount);
        console.log("DEBUG ===>>> userUnReadNotificationCount: " + userUnReadNotificationCount);
        console.log("DEBUG ===>>> user.user_devices.token: " + user.user_devices.token);

        // fcm 格式
        const fcmData: { [key: string]: any } = {};
        // 移除 undefined data 或者 空值的 key 以及物件值得 key
        Object.keys(data).forEach((key) => {
            if (!isEmpty(data[key]) && typeof data[key] !== "object") {
                if (key === "message") {
                    fcmData[key] = String(data[key].substring(0, 100));
                } else {
                    fcmData[key] = String(data[key]);
                }
            }
        });
        console.log("DEBUG fcmData value ===>>>", fcmData);
        // 將所有的 device token 執行發送 fcm 方法
        user.user_devices.forEach(async (item) => {
            const message = {
                data: fcmData,
                notification: {
                    title: data.title.replace(/(<([^>]+)>)/gi, "").substring(0, 100),
                    body: data.message.replace(/(<([^>]+)>)/gi, "").substring(0, 100),
                },
                android: {
                    notification: {
                        sound: "default",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: data.title.replace(/(<([^>]+)>)/gi, ""),
                                body: data.message.replace(/(<([^>]+)>)/gi, ""),
                            },
                            badge: userUnReadServiceMessageCount + userUnReadMessageCount + userUnReadNotificationCount,
                            sound: "default",
                        },
                    },
                },
                token: item.token,
            };
            try {
                await this.messaging.send(message);
                this.loggerService.info(message);
                this.loggerService.info({
                    title: "發送 FCM 成功",
                    token: item.token,
                    tokenData: item,
                });
                console.log({
                    title: "發送 FCM 成功",
                    token: item.token,
                    tokenData: item,
                });
            } catch (err) {
                console.log(err);
                Logger.log("新增 FCM 訊息失敗", err);
                const message: any = {
                    userId,
                    data,
                    notification: { title: data.title, body: data.message },
                    err: err,
                };
                if (!isEmpty(item.token)) {
                    message.token = item.token;
                }
                this.loggerService.error(message);
                this.loggerService.error({
                    title: "發送 FCM 失敗",
                    token: item.token,
                    tokenData: item,
                });
                console.log({
                    title: "發送 FCM 失敗",
                    token: item.token,
                    tokenData: item,
                });
                // throw new HttpException(
                //     {
                //         statusCode: HttpStatus.BAD_REQUEST,
                //         msg: "新增 FCM 訊息資料失敗",
                //         error: {
                //             error: "n4010",
                //             msg: JSON.stringify(err),
                //         },
                //     },
                //     HttpStatus.BAD_REQUEST
                // );
            }
        });
    }
}
