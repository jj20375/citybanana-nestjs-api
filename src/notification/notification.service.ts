import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { RedisCacheService } from "src/redis-cache/redis-cache.service";
import { NotificationFirestoreService } from "src/firebase/notification/notification-firestore/notification-firestore.service";
import { NotificationFirestoreHelperService } from "src/firebase/notification/notification-firestore/notification-firestore-helper/notification-firestore-helper.service";
import { NotificationMessagingService } from "src/firebase/notification/notification-messaging/notification-messaging.service";
import { isEmpty } from "src/service/utils.service";
import { HttpService } from "@nestjs/axios";
import moment from "moment";
import { ConfigService } from "@nestjs/config";
import { ChatsService } from "src/firebase/chats/chats.service";
@Injectable()
export class NotificationService {
    private phpAPI: string;
    constructor(
        private readonly configService: ConfigService,
        private readonly redisCacheService: RedisCacheService,
        private readonly notificationFirestoreService: NotificationFirestoreService,
        private readonly notificationFirestoreHelperService: NotificationFirestoreHelperService,
        private readonly notificationMessagingService: NotificationMessagingService,
        private readonly http: HttpService,
        private readonly chatsService: ChatsService,
    ) {
        this.phpAPI = this.configService.get("host.phpAPI");
    }
    /**
     * 設定單獨通知已讀
     */
    async setReadedNotification(data: { userId: string; notificationId: string }) {
        // 設定通知已讀
        await this.notificationFirestoreService.updateNotificationData({
            userId: data.userId,
            notifyId: data.notificationId,
            updateData: { status: 1 },
        });
        // 減少總通知數量
        await this.notificationFirestoreService.reduceNotificationUnReadCount(data.userId);
        return { success: true };
    }
    /**
     * 設定未讀數量歸 0
     */
    async resetUnReadCount(data: { userId: string }) {
        // 設定通知已讀
        await this.notificationFirestoreHelperService.updateNotificationUnReadCount(data.userId, 0);
        return { success: true };
    }
    /**
     * 設定通知預設資料
     */
    async setNotificationDefaultData(data: { userId: string }) {
        await this.notificationFirestoreService.setNotificationUnReadCount(data.userId);
        return { success: true };
    }
    /**
     * 更新全部已讀
     */
    async setNotificationAllReaded(data: { userId: string; notifyIds: [string] }) {
        await this.notificationFirestoreService.updateNotificationReaded(data);
        return { success: true };
    }
    // 設定通知資料
    async addNotificationData(data: { userId: string; addData: any }) {
        console.log("get userId: ", data.userId);
        console.log("get mark: ", data.addData.mark);
        console.log("addNotificationData function:", data.addData);
        await this.notificationFirestoreHelperService.runTransactionsUpdateUnReadCount(data.userId);
        const obj = {
            title: this.showMessage(data.addData).title,
            mark: data.addData.mark ?? null,
            redis_id: data.addData.id ?? null,
            status: data.addData.status ?? null,
            createdAt: moment(data.addData.time).valueOf(),
            createdDateTime: moment(data.addData.time).format("YYYY-MM-DD HH:mm:ss"),
            type: await this.setType(data.addData),
            avatar: await this.setAvatar(data.addData),
            message: this.showMessage(data.addData).message,
            details: data.addData.data ?? {},
            router: this.showMessage(data.addData).router ?? null,
        };
        // 新增通知資料
        await this.notificationFirestoreService.setNotificationData({
            userId: data.userId,
            setData: obj,
        });
        // fcm app 判斷取得資料的 id
        let sourceId = null;
        // fcm type
        let fcmType = null;
        /**
         * 當收到系統自動婉拒訂單時觸發(會員端)
         * 發送聊天室 開立即刻快閃單的訊息
         */
        if (["d_08"].includes(data.addData.mark)) {
            // 發送系統婉拒訊息
            await this.chatsService.sendCreateDemandMessageByOrder({
                userData: { name: data.addData.data.user.name },
                loginUserId: data.addData.data.user.banana_id,
                receiveUserId: data.addData.data.provider.banana_id,
                justSendLoginUser: true,
                isProvider: false,
                message: "系統自動婉拒預訂",
                orderData: {
                    note: "服務商逾時未回覆",
                    orderId: data.addData.data.order_id,
                    price: data.addData.data.gross_price,
                },
                type: "cancelOrderBySystem",
            });
            // 判斷是即刻快閃可預訂區域時 才發送
            if (this.configService.get("order.demandArea").includes(data.addData.data.district)) {
                console.log("is working d_08");
                // 發送開立即刻快閃單訊息
                await this.chatsService.sendCreateDemandMessageByOrder({
                    userData: { name: data.addData.data.user.name },
                    loginUserId: data.addData.data.user.banana_id,
                    receiveUserId: data.addData.data.provider.banana_id,
                    justSendLoginUser: true,
                    isProvider: false,
                    message: "是否開立即刻快閃單",
                    orderData: {
                        startedAt: data.addData.data.started_at, // 預定開始時間
                        endedAt: data.addData.data.ended_at, // 預定結束時間
                        district: data.addData.data.district, // 活動區域(台北｜高雄等等 iso3166格式)
                        location: data.addData.data.location, // 活動地點
                        description: data.addData.data.description, // 活動描述
                        price: data.addData.data.gross_price, // 訂單總價
                        duration: data.addData.data.details.duration, // 活動時數
                        hourlyPrice: data.addData.data.details.hourlyPrice, // 每小時單價
                    },
                    type: "createDemandByDating",
                });
            }
        }
        /**
         * 當收到系統自動婉拒訂單時觸發(服務商端)
         * 發送聊天室 開立即刻快閃單的訊息
         */
        if (["d_09"].includes(data.addData.mark)) {
            console.log("is working d_09", data.addData.data.user.banana_id, data.addData.data.provider.banana_id);
            // 發送系統婉拒訊息
            await this.chatsService.sendCreateDemandMessageByOrder({
                userData: { name: data.addData.data.user.name },
                loginUserId: data.addData.data.provider.banana_id,
                receiveUserId: data.addData.data.user.banana_id,
                justSendLoginUser: true,
                isProvider: true,
                message: "系統自動婉拒預訂",
                orderData: {
                    note: "服務商逾時未回覆",
                    orderId: data.addData.data.order_id,
                    price: data.addData.data.gross_price,
                },
                type: "cancelOrderBySystem",
            });
        }
        // 現金單訂單類別
        if (data.addData.mark.match(/cash_*.{2,3}/gi)) {
            sourceId = data.addData.data.details.order_id;
            fcmType = "order";
        }
        // 未付款訂單類別
        if (data.addData.mark.match(/q_*.{2,3}/gi)) {
            sourceId = data.addData.data.details.order_id;
            fcmType = "order";
        }
        // 判斷屬於訂單相關的
        if (data.addData.mark.match(/d_*.{2,3}/gi)) {
            sourceId = data.addData.data.details.order_id;
            fcmType = "order";
        }
        // 判斷屬於即刻快閃相關的
        if (data.addData.mark.match(/a_*.{2,3}/gi)) {
            if (data.addData.data.demand) {
                sourceId = data.addData.data.demand.demand_id;
            }
            fcmType = "demand";
        }
        // 當 fcmType 為 null 時觸發
        if (fcmType === null) {
            fcmType = await this.setType(data.addData);
        }
        // 發送 fcm 推播
        await this.notificationMessagingService.sendToUser({
            userId: data.userId,
            setData: obj,
            type: fcmType,
            sourceId,
            loginUserId: null,
        });
        return { success: true };
    }
    // 取得未付款通知資料
    async getUnpayOrder(data: { userId: string | number }) {
        const redisLog = await this.redisCacheService.get(`${this.configService.get("redis.redis_log_path")}-${data.userId}`);
        const result = redisLog.system.filter((item) => {
            return ["q_01"].includes(item.mark);
        });
        return result;
    }
    /**
     * 設定通知資料
     */
    async setNotificationDatas() {
        // 過濾掉的mark  不用來呈現
        const filterMarks = ["d_19", "d_17"];
        const redisKeys = await this.redisCacheService.keys();
        const userIds = redisKeys.map((key) => key.replace(/citybanana_database_notify-log-\*?/g, ""));
        let bananaIds = {};
        try {
            const {
                data: { users },
            } = await this.http
                .post(
                    `${this.phpAPI}/backyard/banana-ids`,
                    { ids: userIds },
                    {
                        headers: {
                            Authorization:
                                "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vYXBpLmNpdHliYW5hbmEuY29tL2FwaS9iYWNreWFyZC9sb2dpbiIsImlhdCI6MTY2MDgyODYwNCwiZXhwIjoxNjYzNDIwNjA0LCJuYmYiOjE2NjA4Mjg2MDQsImp0aSI6IjF4NHQxdzV5d2MwRXVFOWgiLCJzdWIiOjQsInBydiI6IjkyZDVlOGViMWIzOGNjZDExNDc2ODk2YzE5YjBlNDQ1MTJiMmFhY2QifQ.tWBMX984gBcjlyLFY8tqbM-ae-7-8cDPwE9CxcC3QsI",
                        },
                    },
                )
                .toPromise();
            bananaIds = users;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得對應 userIds 失敗",
                    error: {
                        msg: err.response.data,
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        console.log(bananaIds);
        console.log(Object.keys(bananaIds).length);
        // return;
        let count = 0;
        const sleep = (milliseconds) => {
            return new Promise((resolve) => setTimeout(resolve, milliseconds));
        };
        for (let i = 0; i < redisKeys.length; i++) {
            const data = await this.redisCacheService.get(redisKeys[i]);
            await sleep(100);
            const result = data.system.filter((item) => {
                return !filterMarks.includes(item.mark);
            });
            const unReadCount = data.system.filter((item) => item.status === 0).length;
            const key = redisKeys[i].replace(/citybanana_database_notify-log-\*?/g, "");
            if (bananaIds[key] !== undefined) {
                if (result.length > 0) {
                    count++;
                    await this.notificationFirestoreService.setRedisDataNotificationUnReadCount(bananaIds[key], unReadCount);
                    if (bananaIds[key] == "uqwofmo478") {
                        // await this.notificationFirestoreService.setRedisDataNotificationUnReadCount(bananaIds[key], unReadCount);
                        // for (let j = 0; j < result.length; j++) {
                        //     await sleep(100);
                        //     const obj = {
                        //         title: this.showMessage(result[j]).title,
                        //         mark: result[j].mark ?? null,
                        //         redis_id: result[j].id ?? null,
                        //         status: result[j].status ?? null,
                        //         createdAt: moment(result[j].time).valueOf(),
                        //         createdDateTime: moment(result[j].time).format("YYYY-MM-DD HH:mm:ss"),
                        //         type: await this.setType(result[j]),
                        //         avatar: await this.setAvatar(result[j]),
                        //         message: this.showMessage(result[j]).message,
                        //         details: result[j].data ?? {},
                        //     };
                        //     await this.notificationFirestoreService.setNotificationData({ userId: bananaIds[key], setData: obj });
                        //     console.log(key, bananaIds[key], "is down");
                        // }
                    }

                    for (let j = 0; j < result.length; j++) {
                        await sleep(100);
                        const obj = {
                            title: this.showMessage(result[j]).title,
                            mark: result[j].mark ?? null,
                            redis_id: result[j].id ?? null,
                            status: result[j].status ?? null,
                            createdAt: moment(result[j].time).valueOf(),
                            createdDateTime: moment(result[j].time).format("YYYY-MM-DD HH:mm:ss"),
                            type: await this.setType(result[j]),
                            avatar: await this.setAvatar(result[j]),
                            message: this.showMessage(result[j]).message,
                            details: result[j].data,
                            router: this.showMessage(data.addData).router ?? null,
                        };
                        // console.log(obj.type, result[j].mark);
                        // const key = redisKeys[i].replace(/citybanana_database_notify-log-\*?/g, "");
                        await this.notificationFirestoreService.setNotificationData({
                            userId: bananaIds[key],
                            setData: obj,
                        });
                        console.log(key, bananaIds[key], "is down");
                    }
                    console.log(`執行成功數量 ${count}`, bananaIds[key]);
                }
            }
        }
        return redisKeys;
    }

    /**
     * 設定分類
     * @param { type Object(物件) } notifyData
     */
    async setType(notifyData) {
        // mark a 與 d 開頭的為 訂單分類
        if (notifyData.mark.match(/d_*.{2,3}/gi) || notifyData.mark.match(/a_*.{2,3}/gi)) {
            return "order";
        }
        // mark v 與 u 開頭的為 系統分類
        if (notifyData.mark.match(/v_*.{2,3}/gi) || notifyData.mark.match(/u_*.{2,3}/gi)) {
            return "system";
        }
        // mark p 開頭的為 交易分類
        if (notifyData.mark.match(/p_*.{2,3}/gi)) {
            return "transaction";
        }
        return null;
    }
    /**
     * 設定大頭照
     * @param { type Object(物件) } notifyData
     */
    async setAvatar(notifyData) {
        console.log("setAvatar notifyData:", notifyData);
        // 判斷屬於金流的通知 顯示對應大頭照
        if (notifyData.mark.match(/p_*.{2,3}/gi)) {
            return "https://cdn.citybanana.com/icon/coin.png";
        }
        // 判斷屬於金流的通知 顯示對應大頭照
        if (notifyData.mark.match(/v_*.{2,3}/gi)) {
            return "https://cdn.citybanana.com/icon/coin.png";
        }
        // 身份驗證審核成功 顯示對應大頭照
        if (notifyData.mark === "u_01" || notifyData.mark === "u_03" || notifyData.mark === "u_05") {
            return "https://cdn.citybanana.com/icon/authentication-success.png";
        }
        // 身份驗證審核失敗 顯示對應大頭照
        if (notifyData.mark === "u_02" || notifyData.mark === "u_04") {
            return "https://cdn.citybanana.com/icon/authentication-fail.png";
        }
        // 判斷是現金單 服務商取消時觸發
        if (["cash_d_07", "cash_d_24"].includes(notifyData.mark)) {
            // 判斷此data key 中 是否有 user 跟 provider key
            if (notifyData.data.hasOwnProperty("provider")) {
                if (notifyData.data.provider === null) {
                    return "https://cdn.citybanana.com/icon/logo_type1.svg";
                }
                // 對應身份顯示對應大頭照
                return notifyData.data.provider.avatar;
            }
            return "https://cdn.citybanana.com/icon/logo_type1.svg";
        }
        // 成功使用城市推廣員邀請碼註冊成功通知
        if (notifyData.mark === "u_06") {
            return notifyData.data.user.avatar;
        }

        // 開立即刻快閃通知
        if (notifyData.mark === "a_05") {
            return "https://cdn.citybanana.com/icon/logo_type1.svg";
        }
        if (notifyData.mark.match(/a_*.{2,3}/gi)) {
            // 判斷此data key 中 是否有 user 跟 provider key
            if (notifyData.data.hasOwnProperty("user")) {
                if (notifyData.data.user === null) {
                    return "https://cdn.citybanana.com/icon/logo_type1.svg";
                }
                // 對應身份顯示對應大頭照
                return notifyData.data.user.avatar;
            }
            return "https://cdn.citybanana.com/icon/logo_type1.svg";
        }
        // 判斷是否有 data key
        if (notifyData.data !== undefined) {
            // 判斷此data key 中 是否有 user 跟 provider key
            if (notifyData.data.hasOwnProperty("user") && notifyData.data.hasOwnProperty("provider")) {
                // 判斷預訂單儲值未付款通知狀態時 顯示服務商大頭照
                if (notifyData.mark === "q_01") {
                    if (notifyData.data.provider === null) {
                        return "https://cdn.citybanana.com/icon/logo_type1.svg";
                    }
                    return notifyData.data.provider.avatar;
                }
                // 對應身份顯示對應大頭照
                return {
                    provider: notifyData.data.user === null ? "https://cdn.citybanana.com/icon/logo_type1.svg" : notifyData.data.user.avatar,
                    member: notifyData.data.provider === null ? "https://cdn.citybanana.com/icon/logo_type1.svg" : notifyData.data.provider.avatar,
                };
            }
            return null;
        }
        return null;
    }

    /**
     * mark 對應此參考文件
     * https://docs.google.com/spreadsheets/d/1pITaZYYHENpLXlSuNHjAbgEIMuQn_TszJJYg4pn3KZs/edit#gid=1546861523
     *
     * 判斷data 中 type 呈現內容
     * @param datas
     * @returns
     */
    showMessage(datas) {
        // 訂單紀錄頁路由名稱
        const datingRouter = "user-orderRecord-status";
        // 金流紀錄路由名稱
        const pointRoutrer = "user-pointRecord";
        // 快閃折抵金紀錄路由名稱
        const flashDiscount = "user-flashDiscount";
        // 城市推廣金金流紀錄頁
        const cityPlanRecordRouter = "user-city_plan-incomeRecord";
        // 實名驗證路由
        const authenticationRouter = "user-panel-authentication-status";
        // 即刻快閃服務商查看活動細節頁
        const rightNowActivityDetailByProvider = "user-rightNowActivity-provider-id";
        // 即刻快閃會員查看活動細節頁
        const rightNowActivityDetailByMember = "user-rightNowActivity-member-id";
        // 城市推廣人頁面
        const cityPlanRouter = "user-city_plan";
        switch (datas.mark) {
            case "d_01":
                return {
                    title: "請儘速回覆訂單",
                    message: `已收到 ${this.hightLightColor(datas.data.user, "name", "d_01")} 向您發起的預訂，請儘速點擊確認`,
                    router: datingRouter,
                };
                break;
            case "cash_d_01":
                return {
                    title: "請儘速回覆訂單",
                    message: `已收到 ${this.hightLightColor(datas.data.user, "name", "cash_d_01")} 向您發起的預訂<primary-color>(現金付款)</primary-color>，請儘速點擊確認`,
                    router: datingRouter,
                };
                break;
            case "d_02":
                return {
                    title: "",
                    message: `已扣繳預訂費用 ${this.hightLightColor(datas.data.user, "name", "d_02")}。但因餘額不足，未成功向 ${this.hightLightColor(datas.data.provider, "name", "d_02")} 發送預訂`,
                    router: datingRouter,
                };
                break;
            case "d_03":
                return {
                    title: "",
                    message: `${this.hightLightColor(datas.data.user, "name", "d_03")} 已修改預訂，請儘速點擊確認`,
                    router: datingRouter,
                };
                break;
            case "d_04":
                return {
                    title: "訂單已取消",
                    message: `${this.hightLightColor(datas.data.user, "name", "d_04")} 已取消預訂`,
                    router: datingRouter,
                };
                break;
            case "d_05":
                return {
                    title: "訂單臨時取消",
                    message: `${this.hightLightColor(datas.data.user, "name", "d_05")} 已臨時取消預訂，臨時取消費將於結束時間後 24 小時計入帳戶`,
                    router: datingRouter,
                };
                break;
            case "cash_d_05":
                return {
                    title: "訂單臨時取消",
                    message: `${this.hightLightColor(datas.data.user, "name", "cash_d_05")} 已臨時取消預訂`,
                    router: datingRouter,
                };
                break;
            case "d_06":
                return {
                    title: "已接受預訂",
                    message: `${this.hightLightColor(datas.data.provider, "name", "d_06")} 已接受預訂 `,
                    router: datingRouter,
                };
                break;
            case "d_07":
                return {
                    title: "已婉拒預訂",
                    message: `${this.hightLightColor(datas.data.provider, "name", "d_07")} 已婉拒預訂，返還預訂費用 $ <bold>${datas.data.gross_price}</bold>`,
                    router: datingRouter,
                };
                break;
            case "cash_d_07":
                return {
                    title: "已婉拒預訂",
                    message: `${this.hightLightColor(datas.data.provider, "name", "cash_d_07")} 已婉拒預訂`,
                    router: datingRouter,
                };
                break;
            case "d_08":
                return {
                    title: "系統已自動婉拒預訂",
                    message: `您與 ${this.hightLightColor(datas.data.provider, "name", "d_08")} 的預訂已被系統自動婉拒`,
                    router: datingRouter,
                };
                break;
            case "d_09":
                return {
                    title: "系統已自動婉拒預訂",
                    message: `系統已自動婉拒 ${this.hightLightColor(datas.data.user, "name", "d_09")} 向您發起的預訂`,
                    router: datingRouter,
                };
                break;
            case "d_10":
                return {
                    title: "行程將於 24 小時後開始",
                    message: `您與 ${this.hightLightColor(datas.data.provider, "name", "d_10")} 預訂的行程即將在 24 小時後開始`,
                    router: datingRouter,
                };
                break;
            case "d_11":
                return {
                    title: "行程將於 24 小時後開始",
                    message: `您與 ${this.hightLightColor(datas.data.user, "name", "d_11")} 預訂的行程即將在 24 小時後開始`,
                    router: datingRouter,
                };
                break;
            case "d_12":
                return {
                    title: "行程已開始！",
                    message: `您與 ${this.hightLightColor(datas.data.provider, "name", "d_12")} 預訂的行程已開始`,
                    router: datingRouter,
                };
                break;
            case "d_13":
                return {
                    title: "行程已開始！",
                    message: `您與 ${this.hightLightColor(datas.data.user, "name", "d_13")} 預訂的行程已開始`,
                    router: datingRouter,
                };
                break;
            case "d_14":
                return {
                    title: "行程已結束",
                    message: `您與 ${this.hightLightColor(datas.data.provider, "name", "d_14")} 預訂的行程已結束`,
                    router: datingRouter,
                };
                break;
            case "d_15":
                return {
                    title: "行程已結束",
                    message: `您與 ${this.hightLightColor(datas.data.user, "name", "d_15")} 預訂的行程已結束`,
                    router: datingRouter,
                };
                break;
            case "cash_d_15":
                return {
                    title: "行程已結束",
                    message: `您與 ${this.hightLightColor(datas.data.user, "name", "cash_d_15")} 預訂的行程已結束`,
                    router: datingRouter,
                };
                break;
            case "d_16":
                return {
                    title: "會員評價了訂單",
                    message: `會員${this.hightLightColor(datas.data.user, "name", "d_16")} 給您 ${this.hightLightColor(datas.data, "provider_score", "d_16")} 顆星評價！城市因您而美好`,
                    router: datingRouter,
                };
                break;
            case "d_18":
                return {
                    title: "服務商評價了訂單",
                    message: `服務商${this.hightLightColor(datas.data.provider, "name", "d_18")} 給您 ${this.hightLightColor(datas.data, "user_score", "d_18")} 顆星評價！城市因您而美好！`,
                    router: datingRouter,
                };
                break;
            case "d_20":
                return {
                    title: "請儘速回覆訂單！",
                    message: `服務商${this.hightLightColor(datas.data.provider, "name", "d_20")} 已向您提出續約，請儘速點擊確認`,
                    router: datingRouter,
                };
                break;
            case "d_21":
                return {
                    title: "請儘速回覆訂單！",
                    message: `${this.hightLightColor(datas.data.user, "name", "d_21")} 已修改續約，請儘速點擊確認`,
                    router: datingRouter,
                };
                break;
            case "d_22":
                return {
                    title: "續約已取消",
                    message: `${this.hightLightColor(datas.data.user, "name", "d_22")} 已取消續約`,
                    router: datingRouter,
                };
                break;
            case "d_23":
                return {
                    title: "已接受續約",
                    message: `${this.hightLightColor(datas.data.user, "name", "d_23")} 已接受續約`,
                    router: datingRouter,
                };
                break;
            case "d_24":
                return {
                    title: "已婉拒續約",
                    message: `${this.hightLightColor(datas.data.dating.provider, "name", "d_24")} 已婉拒續約，返還續約費用 $ ${this.hightLightColor(
                        datas.data.datingExtension,
                        "gross_price",
                        "d_24",
                    )}`,
                    router: datingRouter,
                };
            case "cash_d_24":
                return {
                    title: "已婉拒續約",
                    message: `${this.hightLightColor(datas.data.dating.provider, "name", "cash_d_24")} 已婉拒續約`,
                    router: datingRouter,
                };
            case "d_25":
                return {
                    title: "收到訂單小費",
                    message: `已收到來自 ${this.hightLightColor(datas.data.dating.user, "name", "d_25")} 的小費 $ ${this.hightLightColor(datas.data, "tip", "d_25")}，別忘記向會員表達感謝`,
                    router: datingRouter,
                };
                break;
            case "p_01":
                return {
                    title: "儲值成功！",
                    message: `儲值成功！$ ${this.hightLightColor(datas.data, "amount", "p_01")} 已計入您的帳戶`,
                    router: pointRoutrer,
                };
                break;
            case "p_02":
                return {
                    title: "扣繳預訂費用",
                    message: `已成功扣繳預訂費用 $ ${this.hightLightColor(datas.data, "gross_price", "p_02")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_02":
                return {
                    title: "已成功發起預訂",
                    message: `成功發起預訂，請耐心等候服務商回應`,
                    router: pointRoutrer,
                };
                break;
            case "p_04":
                return {
                    title: "",
                    message: `已成功修改預訂，扣繳預訂費用差額 $ ${this.hightLightColor(datas.data, "difference", "p_04")}`,
                    router: pointRoutrer,
                };
                break;
            case "p_05":
                return {
                    title: "",
                    message: `已成功修改預訂，返還預訂費用差額 $ ${this.hightLightColor(datas.data, "difference", "p_05")}`,
                    router: pointRoutrer,
                };
                break;
            case "p_06":
                return {
                    title: "返還預訂費用",
                    message: `已成功取消預訂，返還預訂費用 $ ${this.hightLightColor(datas.data, "gross_price", "p_06")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_06":
                return {
                    title: "已取消預訂",
                    message: `成功取消預訂`,
                    router: pointRoutrer,
                };
                break;
            case "p_07":
                return {
                    title: "返還預訂費用",
                    message: `已成功取消預訂，返還預訂費用 $ ${this.hightLightColor(datas.data, "refund", "p_07")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_07":
                return {
                    title: "已取消預訂",
                    message: `成功取消預訂`,
                    router: pointRoutrer,
                };
                break;
            case "p_09":
                return {
                    title: "扣繳續約費用",
                    message: `已成功扣繳續約費用 $ ${this.hightLightColor(datas.data.datingExtension, "gross_price", "p_09")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_09":
                return {
                    title: "已發起續約",
                    message: `成功發起續約，請等候服務商回應`,
                    router: pointRoutrer,
                };
                break;
            case "p_10":
                return {
                    title: "扣繳續約費用",
                    message: `已成功修改續約，扣繳續約費用差額 $ ${this.hightLightColor(datas.data, "difference", "p_10")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_10":
                return {
                    title: "已修改續約",
                    message: `成功修改續約，請等候服務商回應`,
                    router: pointRoutrer,
                };
                break;
            case "p_11":
                return {
                    title: "返還續約費用",
                    message: `已成功修改續約，返還續約費用差額 $ ${this.hightLightColor(datas.data, "difference", "p_11")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_11":
                return {
                    title: "已修改續約",
                    message: `成功修改續約，請等候服務商回應`,
                    router: pointRoutrer,
                };
                break;
            case "p_12":
                return {
                    title: "返還續約費用",
                    message: `已成功取消續約，返還續約費用 $ ${this.hightLightColor(datas.data.datingExtension, "gross_price", "p_12")}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_12":
                return {
                    title: "已取消續約",
                    message: `成功取消續約`,
                    router: pointRoutrer,
                };
                break;
            case "p_14":
                return {
                    title: "提出自行提領申請",
                    message: `成功提出自行提領申請，等待撥款中`,
                    router: pointRoutrer,
                };
                break;
            case "p_16":
                return {
                    title: "自行提領成功",
                    message: `自行提領成功，已將 $ ${this.hightLightColor(datas.data, "amount", "p_16")} 撥入您的銀行帳戶，請於隔日確認入帳情況`,
                    router: pointRoutrer,
                };
                break;
            case "p_17":
                return {
                    title: "自動提領成功",
                    message: `已將前月收益共 $ ${this.hightLightColor(datas.data, "amount", "p_17")} 撥入您的銀行帳戶，請於隔日確認入帳情況`,
                    router: pointRoutrer,
                };
                break;
            case "p_18":
                return {
                    title: "訂單收益已計入您的錢包",
                    message: `訂單收益 $ ${this.hightLightColor(datas.data, "provider_remuneration", "p_18")} 已計入您的帳戶`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_18":
                return {
                    title: "請於 24 小時內繳回款項",
                    message: `會員使用現金付款，請於 24 小時內繳回款項`,
                    router: pointRoutrer,
                };
                break;
            case "p_19":
                return {
                    title: "訂單已取消或逾期",
                    message: `您的訂單已取消或逾期，如您已經付款成功將會轉成 CityBanana 儲值金`,
                    router: pointRoutrer,
                };
                break;
            case "p_20":
                return {
                    title: "返還預訂費用",
                    message: `您的訂單已取消或逾期，返還預訂的費用 $ ${this.hightLightColor(datas.data, "paid", "p_20")} 元`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_20":
                return {
                    title: "該時段已無法預訂",
                    message: `您的訂單已取消或逾期`,
                    router: pointRoutrer,
                };
                break;
            case "p_21":
                return {
                    title: "扣繳小費費用",
                    message: `您已向 ${this.hightLightColor(datas.data.dating.provider, "name", "p_21")} 發送小費，謝謝您的鼓勵與讚賞，已從您的帳戶扣除＄ ${this.hightLightColor(
                        datas.data,
                        "tip",
                        "p_21",
                    )}`,
                    router: pointRoutrer,
                };
                break;
            case "cash_p_21":
                return {
                    title: "扣繳小費費用",
                    message: `已向 ${this.hightLightColor(datas.data.dating.provider, "name", "cash_p_21")} 發送小費通知，記得完成付款`,
                    router: pointRoutrer,
                };
                break;
            case "p_22":
                return {
                    title: "訂單退款",
                    message: `您已收到退款 $ ${this.hightLightColor(datas.data, "refund", "p_22")}`,
                    router: pointRoutrer,
                };
                break;
            case "p_23":
                return {
                    title: "帳戶金額已新增",
                    message: `已新增金額 $ ${this.hightLightColor(datas.data, "amount", "p_23")} 至 CityBanana 帳戶中`,
                    router: pointRoutrer,
                };
                break;
            case "p_24":
                return {
                    title: "帳戶金額已扣除",
                    message: `已自 CityBanana 帳戶中扣除金額 $ ${this.hightLightColor(datas.data, "amount", "p_24")}`,
                    router: pointRoutrer,
                };
                break;
            case "p_24":
                return {
                    title: "帳戶金額已扣除",
                    message: `已自 CityBanana 帳戶中扣除金額 $ ${this.hightLightColor(datas.data, "amount", "p_24")}`,
                    router: pointRoutrer,
                };
                break;
            case "p_25":
                return {
                    title: "信用卡付款失敗",
                    message: `請檢查您輸入的付款資訊，然後再試一次。`,
                };
                break;
            case "p_26":
                return {
                    title: "信用卡付款成功",
                    message: `請至金流記錄查詢`,
                    router: pointRoutrer,
                };
                break;
            case "p_27":
                return {
                    title: "",
                    message: `已將前月收益共 ${this.hightLightColor(datas.data, "charge_off", "p_27")} 撥入您的銀行帳戶，請於隔日確認入帳情況`,
                    router: pointRoutrer,
                };
                break;
            case "q_01":
                return {
                    title: "訂單未完成付款",
                    message: `尚有一筆未完成付款的預訂，點擊查看預訂明細`,
                };
                break;
            case "u_01":
                return {
                    title: "",
                    message: `您申請第一階段實名制驗證已通過`,
                    router: authenticationRouter,
                };
                break;
            case "u_02":
                return {
                    title: "",
                    message: `您申請第一階段實名制驗證未通過`,
                    router: authenticationRouter,
                };
                break;
            case "u_03":
                return {
                    title: "實名驗證已通過",
                    message: `您申請實名制驗證已通過`,
                    router: authenticationRouter,
                };
                break;
            case "u_04":
                return {
                    title: "實名驗證未通過",
                    message: `您申請實名制驗證未通過`,
                    router: authenticationRouter,
                };
                break;
            case "u_05":
                return {
                    title: "您申請城市推廣人已通過",
                    message: ``,
                    router: cityPlanRouter,
                };
                break;
            case "u_06":
                return {
                    title: "成功推廣好友成為會員",
                    message: `你的朋友${this.hightLightColor(datas.data.user, "name", "u_06")}，剛剛加入CityBanana，他的預訂消費額之比例將成為你的收益`,
                    router: cityPlanRouter,
                };
                break;
            case "v_01":
                return {
                    title: "收到快閃折抵金！",
                    message: `已收到快閃折抵金 $ ${this.hightLightColor(datas.data, "amount", "v_01")}，點擊查看明細`,
                    router: flashDiscount,
                };
            case "v_02":
                return {
                    title: "返還快閃折抵金",
                    message: `快閃折抵金 $ ${this.hightLightColor(datas.data, "amount", "v_02")} 已退還至您的帳戶中`,
                };
            case "v_03":
                return {
                    title: "快閃折抵金即將過期",
                    message: `您的快閃折抵金 $ ${this.hightLightColor(datas.data, "amount", "v_03")} 將於月底過期，請儘速使用`,
                };
            case "v_04":
                return {
                    title: "快閃折抵金已過期",
                    message: `您的快閃折抵金 $ ${this.hightLightColor(datas.data, "amount", "v_04")} 已過期，點擊查看明細`,
                    router: flashDiscount,
                };
            case "a_01":
                return {
                    title: "有人報名即刻快閃活動",
                    message: `【${this.hightLightColor(datas.data.user, "name", "a_01")}】報名您的活動 ${this.hightLightColor(datas.data.demand, "name", "a_01")}，有合適的人選請提前確認，招募截止時間到，系統將自行關單，點擊查看`,
                    router: rightNowActivityDetailByMember,
                    params: datas.data.demand.demand_id,
                };
            case "a_02":
                return {
                    title: "已取消即刻快閃活動報名",
                    message: `即刻快閃活動 ${this.hightLightColor(datas.data.demand, "name", "a_02")} ，服務商 ${this.hightLightColor(datas.data.user, "name", "a_02")} 已取消報名，點擊查看明細`,
                    router: rightNowActivityDetailByMember,
                    params: datas.data.demand.demand_id,
                };
            case "a_03":
                return {
                    title: "會員已接受即刻快閃報名",
                    message: `會員已接受您報名 「${this.hightLightColor(datas.data.demand, "name", "a_03")}」 活動，請準備前往，注意安全！`,
                    router: rightNowActivityDetailByProvider,
                    params: datas.data.demand !== undefined ? datas.data.demand.demand_id : datas.data.demand_id,
                };
            case "a_04":
                return {
                    title: "用戶已確認其他人選",
                    message: `即刻快閃活動 ${this.hightLightColor(datas.data.demand, "name", "a_04")} 已確認其他人選，感謝您的報名`,
                    router: rightNowActivityDetailByProvider,
                    params: datas.data.demand !== undefined ? datas.data.demand.demand_id : datas.data.demand_id,
                };
            case "a_05":
                return {
                    title: "您的即刻快閃活動建立成功",
                    message: `等待服務商報名中`,
                    router: rightNowActivityDetailByMember,
                    params: datas.data.demand.demand_id,
                };
            case "a_06":
                return {
                    title: "您的即刻快閃活動已取消",
                    message: `即刻快閃活動 「${this.hightLightColor(datas.data.demand, "name", "a_06")}」 已超過報名時間，系統自動取消`,
                    router: rightNowActivityDetailByMember,
                    params: datas.data.demand.demand_id,
                };
            case "a_07":
                return {
                    title: "用戶取消活動",
                    message: `即刻快閃活動 ${this.hightLightColor(datas.data.demand, "name", "a_04")} 已取消`,
                    router: rightNowActivityDetailByProvider,
                    params: datas.data.demand !== undefined ? datas.data.demand.demand_id : datas.data.demand_id,
                };
            case "a_08":
                return {
                    title: "用戶取消活動",
                    message: `即刻快閃活動 ${this.hightLightColor(datas.data.demand, "name", "a_04")} 已取消`,
                    router: rightNowActivityDetailByProvider,
                    params: datas.data.demand !== undefined ? datas.data.demand.demand_id : datas.data.demand_id,
                };
            default:
                return { message: "" };
        }
    }

    // 將特定字串改顏色呈現
    hightLightColor(obj, key, mark) {
        if (isEmpty(obj)) {
            return "";
        }
        return obj[key] === undefined ? "" : `<primary-color>${obj[key]}</primary-color>`;
    }
}
