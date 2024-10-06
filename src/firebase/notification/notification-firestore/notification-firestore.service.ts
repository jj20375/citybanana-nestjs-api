import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { NotificationFirestoreHelperService } from "./notification-firestore-helper/notification-firestore-helper.service";
@Injectable()
export class NotificationFirestoreService {
    private db;
    constructor(private notHelperService: NotificationFirestoreHelperService, private firbaseInitApp: FirebaseInitApp) {
        this.db = this.firbaseInitApp.firebaseFireStoreDB();
    }

    // 設定通知未讀訊息數量
    async setNotificationUnReadCount(userId: string) {
        // 判斷是否有建立過通知
        const isEmpty = await this.notHelperService.checkNotificationEmpty(userId);
        if (isEmpty) {
            // 重設通知未讀訊息數量為 0
            await this.notHelperService.setNotificationUnReadCount(userId, 0);
        } else {
            // 取得通知未讀訊息數量
            const unReadCount = await this.notHelperService.getNotificationUnReadCount(userId);
            // 更新通知未讀訊息數量
            await this.notHelperService.updateNotificationUnReadCount(userId, unReadCount);
        }
        return { success: true };
    }
    // 扣除通知未讀訊息數量
    async reduceNotificationUnReadCount(userId: string) {
        // 判斷是否有建立過通知
        const isEmpty = await this.notHelperService.checkNotificationEmpty(userId);
        if (isEmpty) {
            // 重設通知未讀訊息數量為 0
            await this.notHelperService.setNotificationUnReadCount(userId, 0);
        } else {
            // 取得通知未讀訊息數量
            let unReadCount = await this.notHelperService.getNotificationUnReadCount(userId);
            unReadCount = unReadCount - 1 < 0 ? 0 : unReadCount - 1;
            // 更新通知未讀訊息數量
            await this.notHelperService.updateNotificationUnReadCount(userId, unReadCount);
        }
        return { success: true };
    }
    // 增加通知未讀訊息數量
    async addNotificationUnReadCount(userId: string) {
        // 判斷是否有建立過通知
        const isEmpty = await this.notHelperService.checkNotificationEmpty(userId);
        if (isEmpty) {
            // 重設通知未讀訊息數量為 0
            await this.notHelperService.setNotificationUnReadCount(userId, 0);
        } else {
            // 取得通知未讀訊息數量
            let unReadCount = await this.notHelperService.getNotificationUnReadCount(userId);
            unReadCount = unReadCount + 1;
            // 更新通知未讀訊息數量
            await this.notHelperService.updateNotificationUnReadCount(userId, unReadCount);
        }
        return { success: true };
    }
    // 設定 redis 通知內容轉移時未讀訊息數量
    async setRedisDataNotificationUnReadCount(userId: string, unReadCount: number) {
        await this.notHelperService.setNotificationUnReadCount(userId, unReadCount);
        return { success: true };
    }
    // 設定通知資料
    async setNotificationData(data: { userId: string; setData: object }) {
        try {
            await this.notHelperService.setNotificationData(data.userId, data.setData);
            return { success: true };
        } catch (err) {
            throw err;
        }
    }
    // 更新通知資料
    async updateNotificationData(data: { userId: string; notifyId: string; updateData: object }) {
        await this.notHelperService.updateNotificationData(data.userId, data.notifyId, data.updateData);
        return { success: true };
    }
    // 批量更新通知已讀
    async updateNotificationReaded(data: { userId: string; notifyIds: [string] }) {
        const paths = await this.notHelperService.getNotificationBatchPaths(data.userId, data.notifyIds);
        /**
         * firestore 批量更新方式 最多一次更新 500 筆
         * 因此寫了一個演算機制 陣列資料 會以 500 筆為一個 單位
         * 超過 500 筆就會有兩個陣列資料 超過 1000筆 就會有三個陣列資料 以此類推
         */
        // 可被整除的數字 (取出可被500整除的最大公倍數，當陣列數小於 500 時 給予預設值 1)
        const divisble = paths.length / 500 < 0 ? 1 : paths.length / 500;

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

        for (let i = 0; i < pathsTotal.length; i++) {
            for (let j = 0; j < paths.length; j++) {
                await this.notHelperService.updateNotificationReaded(paths[j]);
            }
        }
    }
}
