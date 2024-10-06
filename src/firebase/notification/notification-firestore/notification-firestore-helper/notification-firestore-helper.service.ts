import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import moment from "moment";
@Injectable()
export class NotificationFirestoreHelperService {
    private db;
    constructor(private firbaseInitApp: FirebaseInitApp) {
        this.db = this.firbaseInitApp.firebaseFireStoreDB();
    }

    /**
     * 檢查指定使用者是否有建立過 chat_rooms 資料
     * @param { type String(字串) } userId  使用者id
     */
    async checkNotificationEmpty(userId: string) {
        try {
            const doc = await this.db.doc(`notification/${userId}`).get();
            // 找不到此通知
            if (!doc.exists) {
                return true;
            }
            return false;
        } catch (err) {
            Logger.log("檢查個人通知資料是否建立失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "檢查個人通知資料是否建立失敗",
                    error: {
                        error: "n4001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得通知中未讀數量
     * @param { type String(字串) } userId  使用者id
     */
    async getNotificationUnReadCount(userId: string) {
        try {
            const doc = await this.db.doc(`notification/${userId}`).get();
            // 找不到此通知
            if (!doc.exists) {
                return 0;
            }
            return doc.data().unReadCount ?? 0;
        } catch (err) {
            Logger.log("取得通知未讀數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得通知未讀數量失敗",
                    error: {
                        error: "n4007",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 新增通知中未讀訊息數量
     * @param { type String(字串) } userId  使用者id
     */
    async resetNotificationUnReadCount(userId: string) {
        try {
            await this.db.doc(`notification/${userId}`).update({
                unReadCount: 0,
                updatedAt: moment().valueOf(),
            });
        } catch (err) {
            Logger.log("重置通知中未讀數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "重置通知中未讀數量失敗",
                    error: {
                        error: "n4002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 更新通知中未讀訊息數量
     * @param { type String(字串) } userId  使用者id
     * @param { type Number(數字) } unReadCount
     */
    async updateNotificationUnReadCount(userId: string, unReadCount: number) {
        try {
            await this.db.doc(`notification/${userId}`).update({
                unReadCount,
                updatedAt: moment().valueOf(),
            });
        } catch (err) {
            Logger.log("更新通知中未讀數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新通知中未讀數量失敗",
                    error: {
                        error: "n4003",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 設定通知中未讀通知數量
     * @param { type String(字串) } userId  使用者id
     * @param { type Number(數字) } unReadCount
     */
    async setNotificationUnReadCount(userId: string, unReadCount: number) {
        try {
            await this.db.doc(`notification/${userId}`).set({
                unReadCount,
                updatedAt: moment().valueOf(),
            });
        } catch (err) {
            Logger.log("設定通知中未讀通知數量失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定通知中未讀通知數量失敗",
                    error: {
                        error: "n4008",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 檢查指定使用者是否有建立過 chat_rooms 資料
     * @param { type String(字串) } userId  使用者id
     * @param { type String(字串) } notifyId  通知id
     */
    async checkNotificationDataEmpty(userId: string, notifyId: string) {
        try {
            const doc = await this.db.doc(`notification/${userId}/datas/${notifyId}`).get();
            // 找不到此筆通知資料
            if (!doc.exists) {
                return true;
            }
            return false;
        } catch (err) {
            Logger.log("檢查單筆通知資料是否建立失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "檢查單筆通知資料是否建立失敗",
                    error: {
                        error: "n4004",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 新增通知資料
     * @param { type String(字串) } userId  使用者id
     */
    async setNotificationData(userId: string, data) {
        try {
            const doc = await this.db.collection(`notification/${userId}/datas`).doc();
            await doc.set({ ...data, updatedAt: moment().valueOf() });
        } catch (err) {
            console.log(err);
            Logger.log("新增通知資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "新增通知資料失敗",
                    error: {
                        error: "n4005",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 更新通知資料
     * @param { type String(字串) } userId  使用者id
     * @param { type String(字串) } notifyId  通知id
     */
    async updateNotificationData(userId: string, notifyId: string, data) {
        try {
            await this.db.doc(`notification/${userId}/datas/${notifyId}`).update({
                ...data,
                updatedAt: moment().valueOf(),
            });
        } catch (err) {
            Logger.log("更新通知資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新通知資料失敗",
                    error: {
                        error: "n4006",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 更新通知已讀
     * @param { type Any(不限制) } path firestore 通知路徑
     */
    async updateNotificationReaded(path: any) {
        try {
            await path.update({ status: 1, updatedAt: moment().valueOf() });
        } catch (err) {
            Logger.log("批量更新通知已讀失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "批量更新通知已讀失敗",
                    error: {
                        error: "n4009",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 批量更新通知
     * @param { type Any(不限制) } path firestore 通知路徑
     */
    async batchUpdateNotificationReaded(path: any) {
        const batch = this.db.batch();
        try {
            const result = await batch.set(path, { status: 1, updatedAt: moment().valueOf() });
            console.log(result);
        } catch (err) {
            Logger.log("批量更新通知已讀失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "批量更新通知已讀失敗",
                    error: {
                        error: "n4009",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得批量更新路徑
     * @param { type String(字串) } userId 使用者 id
     * @param  { notifyIds: Array(陣列) } notifyIds 通知id列表
     */
    async getNotificationBatchPaths(userId: string, notifyIds: [string]) {
        const paths = [];
        for (let i = 0; i < notifyIds.length; i++) {
            paths.push(this.db.doc(`notification/${userId}/datas/${notifyIds[i]}`));
        }
        return paths;
    }

    /**
     * 交易機制
     */
    async runTransactionsUpdateUnReadCount(userId: string) {
        const doc = this.db.doc(`notification/${userId}`);
        try {
            await this.db.runTransaction(async (transaction) => {
                const notification = await transaction.get(doc);
                // 判斷資料不存在
                if (!notification.exists) {
                    await this.setNotificationUnReadCount(userId, 0);
                    // throw new HttpException(
                    //     {
                    //         statusCode: HttpStatus.BAD_REQUEST,
                    //         msg: "更新通知未讀數量失敗",
                    //         error: {
                    //             error: "n4006",
                    //         },
                    //     },
                    //     HttpStatus.BAD_REQUEST
                    // );
                }
                const newCount = notification.data().unReadCount + 1;
                transaction.update(doc, { unReadCount: newCount });
                return newCount;
            });
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新通知未讀數量失敗",
                    error: {
                        error: "n4006",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
