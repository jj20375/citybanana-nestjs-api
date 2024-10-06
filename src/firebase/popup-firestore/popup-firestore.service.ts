import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PopupFirestoreHelperService } from "src/firebase/popup-firestore/popup-firestore-helper/popup-firestore-helper.service";

@Injectable()
export class PopupFirestoreService {
    constructor(private readonly popupFirstoreHelperService: PopupFirestoreHelperService) {}
    /**
     * 取得popup
     */
    async getPopup(data: { loginUserId: string; id: string }) {
        const doc = await this.popupFirstoreHelperService.getPopup(data);
        if (!doc) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "未找到全域Popup資料",
                    error: {
                        error: "n4013",
                        msg: "未找到全域Popup資料",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        return doc;
    }
    /**
     * 刪除popup
     */
    async deletePopup(data: { loginUserId: string; id: string }) {
        // 檢查是否有虛擬單存在
        const doc = await this.popupFirstoreHelperService.getPopup(data);
        if (!doc) {
            return { success: false };
        }
        await this.popupFirstoreHelperService.deletePopup(data);
        return { success: true };
    }
    /**
     * 刪除訂單 flows 通知
     */
    async removeDatingNotify(data: { path: string }) {
        await this.popupFirstoreHelperService.removeDatingNotify(data);
        return { success: true };
    }
}
