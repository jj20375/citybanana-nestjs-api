import { Injectable, HttpStatus, HttpException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
@Injectable()
export class PopupFirestoreHelperService {
    private db;
    constructor(private firbaseInitApp: FirebaseInitApp, private configService: ConfigService) {
        this.db = this.firbaseInitApp.firebaseFireStoreDB();
    }

    /**
     * 取得popup 通知資料
     */
    async getPopup(data: { loginUserId: string; id: string }) {
        try {
            const doc = await this.db.doc(`popup/${data.loginUserId}/datas/${data.id}`).get();
            if (doc.exists) {
                return doc.data();
            }
            return false;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得全域Popup資料失敗",
                    error: {
                        error: "n4011",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 刪除popup資料
     */
    async deletePopup(data: { loginUserId: string; id: string }) {
        const doc = await this.getPopup(data);
        // 判斷沒有訂單不往下執行
        if (!doc) {
            return { success: true };
        }
        try {
            await this.db.doc(`popup/${data.loginUserId}/datas/${data.id}`).delete();

            return { success: true };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "刪除全域Popup資料失敗",
                    error: {
                        error: "n4012",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 刪除訂單 flows 通知
     */
    async removeDatingNotify(data: { path: string }) {
        console.log("data.path =>", data.path);
        try {
            const result = await this.db.doc(data.path).delete();
            console.log("delete flows =>", result);
            return { success: true };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "刪除訂單通知失敗",
                    error: {
                        error: "n4014",
                        msg: JSON.stringify(err),
                        path: data.path,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
