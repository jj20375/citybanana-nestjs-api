import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";

@Injectable()
export class ClientUiSettingService {
    private ref;
    public serviceChatId: string;
    constructor(private firbaseInitApp: FirebaseInitApp, private configService: ConfigService) {
        this.ref = function (ref) {
            return this.firbaseInitApp.firebaseRealTimeDB(ref);
        };
    }

    /**
     * 取得前台顯示設定值
     */
    async getClientUiSetting() {
        // 預設回傳資料
        const defaultSet = {
            // 顯示前台 ig id 開關
            enable_instagram: false,
            // 顯示評論時間  開關
            enable_comment_time: false,
        };

        try {
            const data = await this.ref("client_ui_settings").get();
            // 取得前台常見問題設定值
            const questions = await this.ref("client_ui_settings/questions").get();
            // 取得前台預訂注意事項設定值
            const importantList = await this.ref("client_ui_settings/important_list").get();
            // 判斷是否有資料
            if (data.exists()) {
                return {
                    ...data.val(),
                    ...questions.val(),
                    ...importantList.val(),
                };
            }
            return defaultSet;
        } catch (err) {
            console.log(err);
            Logger.log("取得前台顯示設定值失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得前台顯示設定值失敗",
                    error: {
                        error: "n20001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
