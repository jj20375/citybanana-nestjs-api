import { Injectable, Logger, HttpStatus, HttpException } from "@nestjs/common";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { LoggerService } from "src/logger/logger.service";
import { isEmpty } from "src/service/utils.service";
import moment from "moment";
import { ChatRealtimeHelperService } from "../../chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
@Injectable()
export class ChatFirestoreHelperService {
    private db;
    private readonly serviceChatId: string;
    constructor(private firbaseInitApp: FirebaseInitApp, private loggerService: LoggerService, private readonly chatRealtimeHelper: ChatRealtimeHelperService) {
        this.db = this.firbaseInitApp.firebaseFireStoreDB();
        this.serviceChatId = process.env.SERVICE_CHAT_ID;
    }
    /**
     * 檢查指定使用者是否有建立過 chat_rooms 資料
     * @param { type String(字串) } userId  使用者id
     */
    async checkUserChatRoomEmpty(userId: string) {
        try {
            const doc = await this.db.doc(`chat_rooms/${userId}`).get();
            // 找不到此 user 聊天室時給 true
            if (!doc.exists) {
                return true;
            }
            return false;
        } catch (err) {
            Logger.log("檢查使用者聊天室個人資料是否存在失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "檢查使用者聊天室個人資料是否存在失敗",
                    error: {
                        error: "n2001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 建立使用者聊天室chat_rooms 資料
     * @param { type Object(物件) } userData 使用者資料
     * @param { type String(字串) } loginUserId 登入者 id
     * @returns
     */
    async setUserChatRoom(userData, loginUserId) {
        const doc = await this.db.doc(`chat_rooms/${loginUserId}/`).get();
        return new Promise(async (resolve, reject) => {
            if (!doc.exists) {
                try {
                    await this.db.doc(`chat_rooms/${loginUserId}`).set({
                        userData,
                        isProvider: userData.role > 0 ? true : false,
                        unReadMessageCount: 0,
                        unReadMessageCountByServiceChat: 0,
                        enableCityAi: false,
                        updatedAt: moment().valueOf(),
                    });
                    resolve(true);
                } catch (err) {
                    reject(err);
                    throw new HttpException(
                        {
                            statusCode: HttpStatus.BAD_REQUEST,
                            msg: "建立使用者聊天室chat_rooms 資料失敗",
                            error: {
                                error: "n2002",
                                msg: JSON.stringify(err),
                            },
                        },
                        HttpStatus.BAD_REQUEST,
                    );
                }
                return;
            }
            try {
                await this.db.doc(`chat_rooms/${loginUserId}`).update({ userData, isProvider: userData.role > 0 ? true : false, updatedAt: moment().valueOf() });
                resolve(true);
            } catch (err) {
                reject(err);
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "更新使用者聊天室chat_rooms 資料失敗",
                        error: {
                            error: "n2003",
                            msg: JSON.stringify(err),
                        },
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        });
    }

    /**
     * 更新指定對象 chat_rooms 資料
     * @param { type String(字串) } userId 使用者 id
     * @param { type Object(物件) } userData 更新資料
     */
    async updateChatRoomUserData(userId, userData) {
        try {
            await this.db.doc(`chat_rooms/${userId}`).update({ userData });
            return;
        } catch (err) {
            console.log("updateChatRoomUserData =>", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新使用者聊天室chat_rooms 資料失敗",
                    error: {
                        error: "n2003",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 檢查聊天對象聊天室是否為空的
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async checkReceiveUserChatRoomEmpty(loginUserId: string, receiveUserId: string) {
        try {
            const doc = await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).get();
            if (!doc.exists) {
                return true;
            }
            return false;
        } catch (err) {
            Logger.log("檢查聊天對象聊天室是否存在失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "檢查聊天對象聊天室是否存在失敗",
                    error: {
                        error: "n2004",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 設定聊天對象聊天室對象資料
     * @param { tpye Object(物件) }  userData 使用者資料
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async setReceiverRoomData(userData, loginUserId, receiveUserId) {
        /**
         * 因為 sequelize 都會多一層 詭異的 dataValues 因此暫時先以此解法解決 firestore 新增資料問題
         */
        // 需要重置 key 的資料 因為這些都是關聯表資料會有 dataValues 的 key 問題
        const resetKeys = ["user_devices", "google_user", "facebook_user", "line_user", "apple_user", "activities", "badges"];
        resetKeys.forEach((key) => {
            if (["activities", "badges"].includes(key)) {
                userData[key] = !isEmpty(userData[key])
                    ? userData[key].map((item) => {
                          return {
                              id: !isEmpty(item.dataValues) ? item.dataValues.id : null,
                              name: !isEmpty(item.dataValues) ? item.dataValues.name : null,
                          };
                      })
                    : null;
            } else {
                userData[key] = !isEmpty(userData[key]) ? userData[key].dataValues ?? userData[key] : null;
            }
        });
        // 檢查是否有聊天室 如果沒有則使用set 方法建立
        const empty = await this.checkReceiveUserChatRoomEmpty(loginUserId, receiveUserId);
        try {
            if (empty) {
                // 判斷是空聊天室時 使用 set 方法建立資料
                await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).set({ userData, isProvider: userData.role > 0 ? true : false, lastMsgAt: -moment().valueOf() });
            } else {
                // 有聊天室時 使用 update 方法更新聊天室資料
                await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).update({ userData, isProvider: userData.role > 0 ? true : false });
            }
            return { success: true };
        } catch (err) {
            this.loggerService.error(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定聊天對象聊天室資料失敗",
                    error: {
                        error: "n2005",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得單一對象未讀訊息數量
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     * @returns
     */
    async getReveiveUserUnReadTotal(receiveUserId, loginUserId) {
        try {
            const doc = await this.db.doc(`chat_rooms/${receiveUserId}/users/${loginUserId}`).get();
            // 判斷沒有資料時回傳 0
            if (doc.empty) {
                return 0;
            }
            // 找不到資料時 回傳預設值 0
            if (doc.data() === undefined) {
                return 0;
            }
            return isEmpty(doc.data().unReadMessageCount) ? 0 : doc.data().unReadMessageCount;
        } catch (err) {
            Logger.log("取得指定對象未讀訊息數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得指定對象未讀訊息數量失敗",
                    error: {
                        error: "n2006",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 設定聊天對象 未讀訊息數量 以及 最後一個 訊息內容
     * @param { type Number(數字) }  unReadCount 未讀訊息數量
     * @param { type String(字串) } lastMessage 最後一筆聊天室訊息內容
     * @param { type String(字串) } loginUserId 登入使用者 id
     * @param { type String(字串) } receiveUserId 聊天對象使用者 id
     */
    async setUnreadCountAndLastMessage(unReadCount, lastMessage, loginUserId, receiveUserId) {
        // 傳送資料
        const data = {
            unReadMessageCount: unReadCount,
            message: lastMessage,
            lastMsgAt: -moment().valueOf(),
        };
        let result: any;
        // 有傳送訊息 且 聊天對象非客服時 觸發
        if (data.message !== undefined && loginUserId !== this.serviceChatId && receiveUserId !== this.serviceChatId) {
            // 過濾聊天訊息中關鍵字
            result = await this.chatRealtimeHelper.replaceChatMessageKeywords({ message: data.message });
            // 判斷移除關鍵字是否成功
            if (result !== false) {
                data.message = result.message;
            }
        }
        // 設定未讀訊息數量 以及 最後一筆訊息內容 與 最後一筆訊息時間
        await this.unReadCountAndLastMessage(data, loginUserId, receiveUserId);
    }
    /**
     * 新增聊天室 未讀訊息數量 與最後一筆聊天內容
     * @param { type Object(物件) } data 未讀訊息數量 以及最後一個聊天內容 { ex: unReadMessageCount: 20, message: "測試內容" }
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async unReadCountAndLastMessage(data, loginUserId, receiveUserId) {
        try {
            await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).update({ ...data, updatedAt: moment().valueOf() });
            return { success: true };
        } catch (err) {
            Logger.log("設定未讀數量與最後聊天內容失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定未讀數量與最後聊天內容失敗",
                    error: {
                        error: "n2007",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    // 取得客服聊天室未讀訊息總計
    async getServcieChatUnReadMessageCount() {
        try {
            const doc = await this.db.doc(`chat_rooms/${this.serviceChatId}`).get();
            // 未讀訊息總計預設值
            const defaultData = {
                unReadMessageCount: 0,
                unReadMessageCountByProvider: 0,
                unReadMessageCountByMember: 0,
            };
            // 判斷客服聊天室沒有資料時給予預設值
            if (!doc.exists) {
                return defaultData;
            }
            // 判斷未設定過未讀訊息總計時 給予預設值
            if (!doc.data().hasOwnProperty("unReadMessageCount")) {
                return defaultData;
            }
            return {
                unReadMessageCount: doc.data().unReadMessageCount !== undefined ? doc.data().unReadMessageCount : 0,
                unReadMessageCountByProvider: doc.data().unReadMessageCountByProvider !== undefined ? doc.data().unReadMessageCountByProvider : 0,
                unReadMessageCountByMember: doc.data().unReadMessageCountByMember !== undefined ? doc.data().unReadMessageCountByMember : 0,
            };
        } catch (err) {
            Logger.log("取得客服聊天室未讀訊息總計數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得客服聊天室未讀訊息總計數量失敗",
                    error: {
                        error: "n2008",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 更新客服未讀訊息累計
     * @param { type Number(數字) } unReadMessageCount 所有未讀訊息數量總計
     * @param { type Number(數字) } unReadMessageCountByProvider 服務商未讀訊息數量總計
     * @param { type Number(數字) } unReadMessageCountByMember 會員未讀訊息數量總計
     * @returns
     */
    async updateServiceChatUnReadMessageCount(unReadMessageCount, unReadMessageCountByProvider, unReadMessageCountByMember) {
        try {
            await this.db.doc(`chat_rooms/${this.serviceChatId}`).update({
                unReadMessageCount,
                unReadMessageCountByProvider,
                unReadMessageCountByMember,
            });
            Logger.log("work firestore", unReadMessageCount, unReadMessageCountByProvider, unReadMessageCountByMember);
        } catch (err) {
            Logger.log("更新客服聊天室未讀訊息數量總計失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新客服聊天室未讀訊息數量總計失敗",
                    error: {
                        error: "n2009",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得指定對象中所有聊天對象未讀訊息總計
     * @param { type String(字串) } userId 使用者id
     */
    async getUserUnReadMessageCount(userId) {
        try {
            const user = await this.db.doc(`chat_rooms/${userId}`).get();
            // 判斷沒有找到客服聊天對象時 回傳預設值0
            if (!user.exists) {
                return 0;
            }
            return user.data().unReadMessageCount;
        } catch (err) {
            Logger.log("取得指定對象與聊天對象未讀訊息數量統計失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得指定對象與聊天對象未讀訊息數量統計失敗",
                    error: {
                        error: "n2010",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 更新指定對象未讀訊息數量總計
     * @param { type String(字串) } userId 使用者id
     * @param { type Number(數字) } unReadMessageCount 未讀訊息數量總計
     */
    async updateUserUnReadMessageCount(userId, unReadMessageCount) {
        // 判斷是否有使用者資料
        const isEmpty = await this.checkUserChatRoomEmpty(userId);
        // 沒有資料時 需使用 set 方法
        if (isEmpty) {
            try {
                // 更新未讀訊息數量
                await this.db.doc(`chat_rooms/${userId}`).set({ unReadMessageCount, updatedAt: moment().valueOf() });
            } catch (err) {
                Logger.log("更新指定對象的未讀訊息總計數量失敗", err);
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "更新指定對象的未讀訊息總計數量失敗",
                        error: {
                            error: "n2011",
                            msg: JSON.stringify(err),
                        },
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        } else {
            try {
                // 更新未讀訊息數量
                await this.db.doc(`chat_rooms/${userId}`).update({ unReadMessageCount, updatedAt: moment().valueOf() });
            } catch (err) {
                Logger.log("更新指定對象的未讀訊息總計數量失敗", err);
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "更新指定對象的未讀訊息總計數量失敗",
                        error: {
                            error: "n2011",
                            msg: JSON.stringify(err),
                        },
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        }
    }

    /**
     * 更新登入者與客服聊天室未讀訊息總計數量
     * @param { type String(字串) } userId 使用者id
     * @returns
     */
    async updateUserUnReadMessageCountByServiceChat(userId) {
        // 登入者與客服聊天對象未讀訊息總計數量
        const serviceChatUnReadCount = await this.getUserByServiceChatUnReadMessageCount(userId);
        // 取得登入者與客服聊天對象未讀訊息數量綜計失敗時 不往下執行
        if (serviceChatUnReadCount === false) {
            Logger.log("取得客服聊天訊息統計失敗");
            return;
        }
        try {
            // 更新登入者與客服聊天室未讀訊息總計數量
            await this.db.doc(`chat_rooms/${userId}/`).update({ unReadMessageCountByServiceChat: serviceChatUnReadCount, updatedAt: moment().valueOf() });
        } catch (err) {
            Logger.log("更新登入者與客服聊天室未讀訊息總計數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新登入者與客服聊天室未讀訊息總計數量失敗",
                    error: {
                        error: "n2012",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 取得登入者與客服聊天未讀訊息數量統計
     * @param { type String(字串) } loginUserId 登入使用者id
     */
    async getUserByServiceChatUnReadMessageCount(loginUserId) {
        try {
            const serviceChat = await this.db.doc(`chat_rooms/${loginUserId}/users/${this.serviceChatId}`).get();
            // 判斷沒有找到客服聊天對象時 回傳預設值0
            if (!serviceChat.exists) {
                return 0;
            }
            return serviceChat.data().unReadMessageCount;
        } catch (err) {
            Logger.log("取得登入者與客服聊天未讀訊息數量統計失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得登入者與客服聊天未讀訊息數量統計失敗",
                    error: {
                        error: "n2013",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 設定客服為機器人
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async setServiceChatToBot(loginUserId, receiveUserId) {
        try {
            await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).update({ isBot: true, updatedAt: moment().valueOf() });
            return { success: true };
        } catch (err) {
            Logger.log("切換成機器人客服失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "切換成機器人客服失敗",
                    error: {
                        error: "n2014",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 設定客服為真人客服
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async setServiceChatToReal(loginUserId, receiveUserId) {
        try {
            await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).update({ isBot: false, updatedAt: moment().valueOf() });
            return { success: true };
        } catch (err) {
            Logger.log("切換成真人客服失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "切換成真人客服失敗",
                    error: {
                        error: "n2021",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 聊天室對象 未讀訊息歸 0
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async messageReaded(loginUserId, receiveUserId) {
        try {
            await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).update({ unReadMessageCount: 0, updatedAt: moment().valueOf() });
            return { success: true };
        } catch (err) {
            Logger.log("設定指定聊天對象未讀訊息數量歸0失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定指定聊天對象未讀訊息數量歸0失敗",
                    error: {
                        error: "n2020",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 取得聊天對象資料
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async getReceiverData(loginUserId: string, receiveUserId: string) {
        try {
            const doc = await this.db.doc(`chat_rooms/${loginUserId}/users/${receiveUserId}`).get();
            if (!doc.exists) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "取得聊天對象資料失敗",
                        error: {
                            error: "n2023",
                            msg: "尚未建立聊天對象資料",
                        },
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
            return doc.data();
        } catch (err) {
            Logger.log("取得聊天對象資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得聊天對象資料失敗",
                    error: {
                        error: "n2023",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 將聊天室已讀訊息時間記錄在聊天對象與登入者的聊天室中
     * @param { type String(字串) } receiveUserId 登入使用者id
     * @param { type String(字串) } loginUserId 聊天對象使用者id
     * @returns
     */
    async setReadedTime(receiveUserId, loginUserId) {
        try {
            // 加 1000 毫秒 以防延遲 導致時間小於訊息創建時間
            await this.db.doc(`chat_rooms/${receiveUserId}/users/${loginUserId}`).update({ readedAt: moment().valueOf() + 1000 });
        } catch (err) {
            console.log("設定已讀時間失敗", err);
            return err;
        }
    }

    /**
     * 取得所有聊天對象資料
     * @param { type String(字串) } userId 使用者 banana_id
     */
    async getAllReceiverData(userId: string) {
        try {
            const docRef = await this.db.collection(`chat_rooms/${userId}/users`).get();
            const datas = [];
            docRef.forEach((doc) => {
                if (doc.exists) {
                    datas.push(doc.data());
                }
            });
            return datas;
        } catch (err) {
            console.log(err);
            Logger.log("取得聊天對象資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得聊天對象資料失敗",
                    error: {
                        error: "n2023",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得登入使用者 firestore 聊天對象 id
     * @param { type String(字串) } loginUserId  登入使用者id
     * @returns
     */
    async getChatRoomUserReceiverKeys(loginUserId: string) {
        try {
            const chatRoomUsers = await this.db.collection(`chat_rooms/${loginUserId}/users`).get();
            if (chatRoomUsers.empty) {
                return [];
            }

            const keys = [];

            const getKeys = function () {
                return new Promise((resolve) => {
                    chatRoomUsers.forEach((user) => {
                        keys.push(user.id);
                    });
                    resolve(keys);
                });
            };
            return await getKeys();
        } catch (err) {
            console.log("firebaseChatRoomUserKeys => ", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得聊天對象資料失敗",
                    error: {
                        error: "n2023",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 更新聊天對象資料
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type Array(陣列) } receiveUserIds 聊天對象 id
     * @param { type Object(物件) } updateData 更新資料
     * @returns
     */
    async chatRoomReceiverDataUpdate(loginUserId, receiveUserIds, updateData): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const paths = [];
            for (let i = 0; i < receiveUserIds.length; i++) {
                // 判斷此聊天對象未聊過天時 不執行
                const doc = await this.db.doc(`chat_rooms/${receiveUserIds[i]}/users/${loginUserId}`).get();
                if (doc.exists) {
                    paths.push(this.db.doc(`chat_rooms/${receiveUserIds[i]}/users/${loginUserId}`));
                }
            }
            const batch = this.db.batch();
            /**
             * firestore 批量更新方式 最多一次更新 500 筆
             * 因此寫了一個演算機制 陣列資料 會以 500 筆為一個 單位
             * 超過 500 筆就會有兩個陣列資料 超過 1000筆 就會有三個陣列資料 以此類推
             */
            // 可被整除的數字 (取出可被500整除的最大公倍數，當陣列數小於 500 時 給予預設值 1)
            const divisble = Number(paths.length / 500) < 0 ? 1 : Number(paths.length / 500);
            // 需要更新的所有路徑 (將陣列資料 以 500 筆 為單位 拆成 二維陣列資料方式存入)
            const pathsTotal = [];
            // 判斷最大公倍數有多少執行回圈多少次
            for (let i = 0; i < divisble; i++) {
                pathsTotal[i] = paths.slice(i * 500, (i + 1) * 500);
            }
            // 陣列數 / 500後 如果未整除時 將剩餘陣列資料塞入 pathsToatal 中
            if (paths.length / 500 > divisble) {
                // 新增一筆陣列資料將最後剩餘的資料塞入
                pathsTotal[divisble] = paths.splice(divisble * 500, paths.length);
            }
            // 更新聊天對象資料
            pathsTotal.forEach(async (paths) => {
                paths.forEach(async (path) => {
                    try {
                        await batch.update(path, { userData: updateData });
                    } catch (err) {
                        console.log("批量更新聊天對象資料失敗", err);
                        reject();
                    }
                });
                await batch.commit();
            });
            resolve();
        });
    }
}
