import { Injectable, Logger, HttpException, HttpStatus, forwardRef, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { LoggerService } from "src/logger/logger.service";
import { TelegramService } from "src/telegram/telegram.service";

@Injectable()
export class ChatRealtimeHelperService {
    private ref;
    public serviceChatId: string;
    constructor(
        private firbaseInitApp: FirebaseInitApp,
        private configService: ConfigService,
        private readonly loggserService: LoggerService,
        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,
    ) {
        this.ref = function (ref) {
            return this.firbaseInitApp.firebaseRealTimeDB(ref);
        };
        this.serviceChatId = this.configService.get("chat.serviceChatId");
    }
    /**
     * 發送聊天訊息
     * @param { type Object(物件) } data 聊天室內容
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async sendMessage(data, loginUserId, receiveUserId) {
        let result: any;
        // 判斷聊天訊息有 content key 時觸發 且聊天對象 不是 客服的情況下出發
        if (data.content !== undefined && loginUserId !== this.serviceChatId && receiveUserId !== this.serviceChatId) {
            // 過濾聊天訊息中關鍵字
            result = await this.replaceChatMessageKeywords({ message: data.content });
            // 判斷移除關鍵字是否成功
            if (result !== false) {
                data.content = result.message;
            }
        }
        try {
            // 判斷有平台限制關鍵字時觸發
            if (result !== undefined) {
                if (result.keywordWarning) {
                    // 發送警告文字到聊天室
                    await this.ref(`chats/${loginUserId}/${receiveUserId}`).push({
                        type: "keywordWarning",
                        content: result.keywordWarningContent,
                        createdAt: this.firbaseInitApp.firebaseRealTimeDBTimeStamp(),
                    }).key;
                    // 發送警告文字到聊天室
                    await this.ref(`chats/${receiveUserId}/${loginUserId}`).push({
                        type: "keywordWarning",
                        content: result.keywordWarningContent,
                        createdAt: this.firbaseInitApp.firebaseRealTimeDBTimeStamp(),
                    }).key;
                }
            }
            await this.ref(`chats/${loginUserId}/${receiveUserId}`).push({
                ...data,
                createdAt: this.firbaseInitApp.firebaseRealTimeDBTimeStamp(),
            }).key;
            return { success: true };
        } catch (err) {
            console.log(err);
            Logger.log("發送訊息失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "發送訊息失敗",
                    error: {
                        error: "n2015",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 取得歡迎訊息樣板
     */
    async getProviderDefaultMessage() {
        try {
            const data = await this.ref("provider_default_message").get();
            // 有資料在更新表單內容
            if (data.exists()) {
                return data.val().content;
            }
            return "";
        } catch (err) {
            Logger.log("取得服務商預設樣板訊息失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得服務商預設樣板訊息失敗",
                    error: {
                        error: "n2016",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 判斷是否小於兩筆聊天資料
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async isMessageDataLessThanTwo(loginUserId, receiveUserId) {
        try {
            // 取得會員對象訊息
            const data = await this.ref(`chats/${loginUserId}/${receiveUserId}`).get();
            // 當有取得資料時不往下執行
            if (data.exists() && Object.keys(data.val()).length > 1) {
                return false;
            }
            return true;
        } catch (err) {
            Logger.log("取得聊天內容失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得聊天內容失敗",
                    error: {
                        error: "n2017",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得註冊發送歡迎訊息樣板
     * @returns
     */
    async getRegisterWelcomeMessageSample() {
        // 取得註冊發送訊息資料
        try {
            const data = await this.ref("register_message").get();
            // 有資料在更新表單內容
            if (data.exists()) {
                return data.val().content;
            }
            return false;
        } catch (err) {
            console.log("取得註冊發送樣板訊息資料失敗 n2018 => ", err);
            this.loggserService.error({
                title: "取得註冊發送樣板訊息資料失敗 n2018",
                err,
            });
            Logger.log("取得註冊發送樣板訊息資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得註冊發送樣板訊息資料失敗",
                    error: {
                        error: "n2018",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得機器人回覆問題
     * @param { type Boolean(布林) } isProvider 判斷是否為服務商
     */
    async getbotAnsewerMessage(isProvider: boolean) {
        try {
            // 預設機器人回覆訊息
            let botMessages = [];
            // 判斷是服務商或會員連接指定的問題資料
            const botPath = isProvider ? "provider_questions" : "member_questions";
            // 取得機器人問題
            const data = await this.ref(botPath).get();
            // 判斷是否有訊息
            if (data.exists()) {
                botMessages = data.val();
                return botMessages;
            }
            return botMessages;
        } catch (err) {
            Logger.log("取得客服回應訊息資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得客服回應訊息資料失敗",
                    error: {
                        error: "n2019",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 刪除訊息
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async removeMessages(loginUserId: string, receiveUserId: string) {
        try {
            await this.ref(`chats/${loginUserId}/${receiveUserId}`).remove();
            return true;
        } catch (err) {
            Logger.log("刪除聊天室訊息失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "刪除聊天室訊息失敗",
                    error: {
                        error: "n2022",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 判斷是否有聊天訊息
     * @param { type String(字串) } loginUserId  登入使用者id
     * @param { type String(字串) } receiveUserId  聊天對象使用者id
     */
    async isEmptyMessages(loginUserId: string, receiveUserId: string) {
        try {
            const data = await this.ref(`chats/${loginUserId}/${receiveUserId}`).get();
            // 當有取得資料時不往下執行
            if (data.exists()) {
                return false;
            }
            return true;
        } catch (err) {
            Logger.log("判斷是否有聊天訊息失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "判斷是否有聊天訊息失敗",
                    error: {
                        error: "n2025",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 判斷與客服聊天時是否發送 telegram 訊息
     */
    async isServiceRoomSendTelegramMessage() {
        try {
            const data = await this.ref(`system_settings/open_service_room_send_telegram`).get();
            // 當有取得資料時不往下執行
            if (!data.exists()) {
                return false;
            }
            return data.val();
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得判斷是否與客服聊天時 發送 telegram 訊息設定值失敗",
                    error: {
                        error: "n2026",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 取得須過濾聊天室中的關鍵字
     */
    async getSocialMediaReplaceKeywords() {
        try {
            const data = await this.ref(`social_media_replace_keywords`).get();
            // 當有取得資料時不往下執行
            if (!data.exists()) {
                return false;
            }
            return data.val();
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得須過濾聊天室中關鍵字資料失敗",
                    error: {
                        error: "n2027",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 過濾聊天訊息關鍵字
     */
    async replaceChatMessageKeywords(data: { message: string }): Promise<boolean | { message: string; keywordWarning: boolean; keywordWarningContent: string }> {
        // 取得所有過濾關鍵字
        const keywords = await this.getSocialMediaReplaceKeywords();
        // 當沒有資料時回傳 false
        if (!keywords) {
            return false;
        }
        // 過濾關鍵字
        const replaceKeywords = [];
        // 整理需要過濾的關鍵字到 replaceKeywords 變數裡
        Object.keys(keywords).forEach((objKey) => {
            if (Object.keys(keywords[objKey]).length > 0) {
                Object.keys(keywords[objKey]).forEach((objKey2) => {
                    replaceKeywords.push(keywords[objKey][objKey2]["keywords"]);
                });
            }
        });
        // 判斷是否有過濾過的關鍵字 並記錄起來
        const haveReplaceKeywords = [];
        // 過濾後的聊天訊息
        let replaceMessage = data.message;
        try {
            replaceKeywords.forEach(async (word) => {
                let keyWord = `${word}`;
                // 判斷過濾關鍵字有 + 字串時 需移除掉 否則 regex 會出現錯誤
                if (/\+/.test(word)) {
                    keyWord = keyWord.replace(/^\+/, "");
                }
                const regex = new RegExp(keyWord, "gi");
                const result = regex.exec(data.message);
                // 判斷有傳送訊息是否有過濾關鍵字
                if (result !== null && result[0] !== "") {
                    haveReplaceKeywords.push(result[0]);
                    replaceMessage = data.message.replace(regex, "*");
                }
            });
        } catch (error) {
            console.log(error);
        }
        console.log("message replace =>", replaceMessage, data.message);
        return { message: replaceMessage, keywordWarning: haveReplaceKeywords.length > 0, keywordWarningContent: keywords.keyword_warning_content };
    }
}
