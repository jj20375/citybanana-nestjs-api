import { Injectable, HttpStatus, HttpException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import moment from "moment";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
@Injectable()
export class VorderFirestoreHelperService {
    private db;
    constructor(private firbaseInitApp: FirebaseInitApp, private configService: ConfigService) {
        this.db = this.firbaseInitApp.firebaseFireStoreDB();
    }

    /**
     * 設定虛擬訂單
     * @param data {
     * startedAt: 開始時間
     * categoryId: 分類 id
     * duration: 時數
     * district: 會面區域（ex:台北區域）
     * location: 會面地點
     * description: 活動內容
     * memberId: 會員 bananaId
     * providerId: 服務商 bananaId
     * }
     * @returns
     */
    async setVorder(data: { startedAt: Date; district: string; location: string; description: string; memberId: string; providerId: string }) {
        const doc = await this.db.doc(`vorder/${data.memberId}/users/${data.providerId}`).get();
        const setData = {
            startedAt: data.startedAt,
            district: data.district,
            location: data.location,
            description: data.description,
        };
        try {
            if (!doc.exists) {
                await this.db.doc(`vorder/${data.memberId}/users/${data.providerId}`).set({
                    ...setData,
                    isProviderRes: 0,
                    isSystemRes: 0,
                    createdAt: moment().valueOf(),
                });
                return { success: true };
            } else {
                await this.db.doc(`vorder/${data.memberId}/users/${data.providerId}`).update({
                    ...setData,
                    isProviderRes: 0,
                    isSystemRes: 0,
                    createdAt: moment().valueOf(),
                });
                return { success: true };
            }
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定虛擬訂單失敗",
                    error: {
                        error: "n8001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 取得虛擬訂單
     */
    async getVorder(data: { loginUserId: string; receiveUserId: string }) {
        try {
            const doc = await this.db.doc(`vorder/${data.loginUserId}/users/${data.receiveUserId}`).get();
            if (doc.exists) {
                return doc.data();
            }
            return false;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得虛擬訂單失敗",
                    error: {
                        error: "n8002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 刪除虛擬訂單
     */
    async deleteVorder(data: { loginUserId: string; receiveUserId: string }) {
        const doc = await this.getVorder(data);
        // 判斷沒有訂單不往下執行
        if (!doc) {
            return { success: true };
        }
        try {
            await this.db.doc(`vorder/${data.loginUserId}/users/${data.receiveUserId}`).delete();
            return { success: true };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "刪除虛擬訂單失敗",
                    error: {
                        error: "n8004",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得待回覆虛擬訂單
     */
    async getStayResVorders() {
        try {
            const docRef = this.db.collection(`vorder`);
            // 取得所有詢問單資料方法
            const datas = await docRef.listDocuments();
            // 開立詢問單的使用者 id
            const vorderUserIds = [];
            // 詢問單資料
            const vorders = {};
            if (Object.keys(datas).length > 0) {
                datas.forEach(async (doc) => {
                    // 整理開立過詢問單 user
                    vorderUserIds.push(doc.id);
                });
            }
            if (vorderUserIds.length > 0) {
                for (let i = 0; i < vorderUserIds.length; i++) {
                    // 取得 詢問單對象 超過規定時間未回應  且服務商與系統也未回應過
                    const docRef = await this.db
                        .collection(`vorder/${vorderUserIds[i]}/users`)
                        .where(
                            "createdAt",
                            "<",
                            moment()
                                .subtract(Number(this.configService.get("host.waitHoursBySystemResponseVorder")), "hours")
                                .valueOf()
                        )
                        .where("isProviderRes", "==", 0)
                        .where("isSystemRes", "==", 0)
                        .get();
                    const vorderReceiverIds = [];
                    docRef.forEach((doc) => {
                        if (doc.exists) {
                            vorders[vorderUserIds[i]] = {};
                            vorderReceiverIds.push({
                                id: doc.id,
                                value: doc.data(),
                            });
                        }
                        for (let j = 0; j < vorderReceiverIds.length; j++) {
                            vorders[vorderUserIds[i]][vorderReceiverIds[j].id] = vorderReceiverIds[j].value;
                        }
                    });
                }
            }
            return vorders;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得虛擬訂單失敗",
                    error: {
                        error: "n8002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 更新詢問單已自動回覆狀態
     */
    async updateVorderAutoFeedBack(data: { memberId: string; providerId: string }) {
        try {
            await this.db.doc(`vorder/${data.memberId}/users/${data.providerId}`).update({
                isSystemRes: 1,
                systemResTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            });
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新虛擬訂單自動回覆狀態失敗",
                    error: {
                        error: "n8006",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 更新詢問單服務商已回覆狀態
     */
    async updateVorderProviderFeedBack(data: { memberId: string; providerId: string }) {
        try {
            await this.db.doc(`vorder/${data.memberId}/users/${data.providerId}`).update({
                isProviderRes: 1,
                providerResTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            });
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新虛擬訂單自動回覆狀態失敗",
                    error: {
                        error: "n8007",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得詢問單報表
     */
    async getVorderReport() {
        try {
            const vorderDocs = await this.db.collection(`vorder`).listDocuments();
            const userIds = [];
            const result = {};
            for (let i = 0; i < vorderDocs.length; i++) {
                userIds.push(vorderDocs[i].id);
                const datas = await this.db.collection(`vorder`).doc(vorderDocs[i].id).collection("users").get();
                const user = await this.db.doc(`chat_rooms/${vorderDocs[i].id}`).get();
                result[vorderDocs[i].id] = { name: user.data().userData.name, count: datas.docs.length };
            }
            // await vorderDocs.forEach(async (doc) => {
            //     return result;
            // });
            return { userIds, result };
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得詢問單報表失敗",
                    error: {
                        error: "n8007",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
