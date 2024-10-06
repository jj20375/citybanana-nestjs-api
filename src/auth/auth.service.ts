import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, HttpStatus, HttpException, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/users/user.entity";
import { UsersHelperService } from "src/users/users-helper.service";
import { Op } from "sequelize";
import { UserFeedback } from "src/users/userFeedback/userFeedback.entity";
import { UsersRepository } from "src/users/users.repository";
import moment from "moment";
// 產生亂數方法
import { createRandom } from "src/service/utils.service";
// redis 方法
import { RedisCacheService } from "src/redis-cache/redis-cache.service";
// redis 存入的簡訊驗證資料
import { IverifyCode } from "./interface/verifyCode.interface";
// 導入 hash 套件
import * as bcrypt from "bcryptjs";
// 三竹簡訊方法
import { MitakeSmsService } from "src/sms/mitake-sms/mitake-sms.service";
// short-message log 寫入方法
import { ShortMessageLogsService } from "src/short-message-logs/short-message-logs.service";
// platform log 寫入方法
import { PlatformLogsService } from "src/platform-logs/platform-logs.service";
// 三竹簡訊驗證 api 回傳格式
import { IMitakeSmSendResponse } from "src/sms/mitake-sms/interface/mitake-sms.interface";
import { LoggerService } from "src/logger/logger.service";
// 停權狀態型別對應
enum suspendedStatus {
    // 停權
    SUSPENDED = -1,
    // 永久停權
    PERMANENTLY_SUSPENDED = -2,
}
// 使用者反映表，型別對應
enum feedbackTypes {
    ACCOUNT = 1,
}
// 使用者反映表，處理狀態對應表
enum feedbackHandleStatus {
    QUEUING = 0,
}
// 驗證簡訊
enum verifyAuthCode {
    //  可重複驗證簡訊驗證碼次數（當超過此次數時 該驗證碼無效）
    MAX_AUTH_RETRY = 5,
    // 簡訊驗證碼保存在 Redis 時間(秒)
    SM_AUTH_CODE_REDIS_EXPIRATION = 60 * 5,
    // 簡訊驗證碼時效性
    SM_AUTH_CODE_EXPIRATION_MINUTES = 5,
    // 簡訊驗證碼 short_message_logs type
    SM_AUTH_CODE_SHORT_MESSAGE_LOG_TYPE = 0,
}
@Injectable()
export class AuthService {
    private phpAPI: string;
    private jwtExpiredTime: string;
    constructor(
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => UsersRepository))
        public usersRepository: UsersRepository,
        public readonly usersHelper: UsersHelperService,
        private readonly http: HttpService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => RedisCacheService))
        private readonly redisCacheService: RedisCacheService,
        private readonly mitakSmsService: MitakeSmsService,
        private readonly shortMessageLogsService: ShortMessageLogsService,
        private readonly platformLogsService: PlatformLogsService,
        private readonly loggerService: LoggerService
    ) {
        this.phpAPI = this.configService.get("host.phpAPI");
        this.jwtExpiredTime = this.configService.get("host.jwtExpiredTime");
    }

    /**
     * 登入驗證
     * @param phone 帳號
     * @param password 密碼
     * @returns
     */
    async validateUser(phone: string, password: string): Promise<any> {
        // 取得登入後使用者資料
        let user: any = await this.usersRepository.findOne(
            {
                column: "phone",
                value: phone,
            },
            true
        );
        // 當使用者等於 null 時回傳 false
        if (user === null) {
            return false;
        }
        // 當密碼解析失敗時 回傳 false
        const isMatch = await this.usersHelper.verifyPassword(password, user.password);
        if (!isMatch) {
            return false;
        }
        // 刪除密碼欄位
        delete user.password;
        const userThumbnails = await this.usersHelper.userThumbnails({
            bananaId: user.banana_id,
            gender: user.gender,
            photos: user.media.photos ?? [],
            videos: user.media.videos ?? [],
        });
        user = { ...user, ...userThumbnails };
        return user;
    }

    async login(data: { phone: string; password: string; id: string }) {
        // 要加入 jwt 演算的資料
        const payload = { phone: data.phone, sub: data.id, iss: `${process.env.HOST}/auth/login` };
        try {
            const accessToken = this.jwtService.sign(payload, {
                // token 加密字串
                secret: process.env.JWT_SECRET,
                // token 時效天數
                expiresIn: this.jwtExpiredTime,
            });
            return { access_token: accessToken };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "登入失敗",
                    error: {
                        error: "n3011",
                        msg: "登入失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    // 創建 token
    async createToken(data: { phone?: string; userId: string | number }) {
        // 要加入 jwt 演算的資料
        const payload = { phone: data.phone, sub: data.userId, iss: `${process.env.HOST}/auth/login` };
        try {
            const accessToken = this.jwtService.sign(payload, {
                // token 加密字串
                secret: process.env.JWT_SECRET,
                // token 時效天數
                expiresIn: this.jwtExpiredTime,
            });
            console.log(accessToken);
            return { access_token: accessToken };
        } catch (err) {
            console.log("創建token失敗 n3012 => ", err);
            this.loggerService.error({
                title: "創建token失敗 n3012",
                err,
            });
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "創建token失敗",
                    error: {
                        error: "n3012",
                        msg: "創建token失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    // 取得 以登入者  user profile 呼叫 php api 取得
    async getClientUserProfile(data: { token: string }) {
        const headersRequest = {
            Authorization: `Bearer ${data.token}`,
        };
        try {
            const res = await this.http.get(`${this.phpAPI}/auth/user-profile`, { headers: headersRequest }).toPromise();
            return res.data;
        } catch (err) {
            console.log(err);
            Logger.error("查無使用者資料", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "查無使用者資料",
                    token: data.token,
                    error: {
                        error: "n3006",
                        msg: JSON.stringify(err.response.data),
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
    }

    /**
     * 判斷使用者停權
     * @param { type Obejct(物件) } data.phone 使用者手機號碼（等同於帳號)
     */
    async hasSuspended(data: { phone: string }) {
        const user = await this.usersRepository.hasSuspended({
            phone: data.phone,
        });
        if (user !== null) {
            // 判斷是永久停權狀態
            if (user.status === suspendedStatus.PERMANENTLY_SUSPENDED) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.FORBIDDEN,
                        msg: "此用戶已被永久停權",
                        error: {
                            error: 1009,
                            msg: `停權狀態${user.status}`,
                        },
                        has_feedback: 2, // 永久停權狀態下不給申訴因此直接給予 has_feedback 值為 2
                        banana_id: user.banana_id,
                    },
                    HttpStatus.FORBIDDEN
                );
            }
            if (user.status === suspendedStatus.SUSPENDED) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.FORBIDDEN,
                        msg: "此用戶已被停權",
                        error: {
                            error: 1009,
                            msg: `停權狀態${user.status}`,
                        },
                        has_feedback:
                            user.user_feedbacks.filter((item) => item.type === feedbackTypes.ACCOUNT && item.status === feedbackHandleStatus.QUEUING)
                                .length > 0
                                ? 1
                                : 0,
                        banana_id: user.banana_id,
                    },
                    HttpStatus.FORBIDDEN
                );
            }
        }
        return false;
    }

    /**
     * 驗證 jwt 是否已經更換過版本
     * 須將其它 jwt 視為失效
     */
    async validateJWTVersion(data: { userId: string | number; iat: number }) {
        // 取得登入後使用者資料
        const user: any = await this.usersRepository.findOne({
            column: "id",
            value: data.userId,
        });
        // 查無此 user 時 回傳失敗
        if (user === null) {
            return false;
        }
        // 判斷此欄位沒有值時回傳正確
        if (!user.valid_jwt_after) {
            return user;
        }
        // 將資料庫時間轉換成 utc 否則 moment 時差會多了 8小時
        const unixTime = moment.utc(user.valid_jwt_after).format("YYYY-MM-DD HH:mm:ss");
        /**
         * 判斷有 jwt 修正的時間時 去比對 請求 jwt 的 iat 值 是否小於 valid_jwt_after 時間
         * 如果小於時此 jwt 視為無效
         */
        if (data.iat < moment(unixTime).unix() && user.valid_jwt_after !== null) {
            return false;
        }
        return user;
    }

    /**
     * 創建簡訊驗證碼
     * @param limitBit 需產剩幾位數的簡訊驗證碼
     */
    createAuthCode(limitBit: number) {
        const random = [];
        for (let i = 0; i < limitBit; i++) {
            random.push(createRandom(0, 9));
        }
        return random.join("");
    }

    /**
     * 設定 redis cache 簡訊驗證碼資料
     */
    async setCacheAuthVerifyCodeInfo(data: {
        phone: string;
        code: number | string;
        crumb: string;
        createTime: string;
        msgid: string;
        content: string;
        balance: number;
        ip?: string;
    }): Promise<any> {
        const key = this.redisCacheService.setRedisKey({ type: "auth", category: `verify-code`, id: data.phone });
        const value = JSON.stringify({
            phone: data.phone,
            code: data.code,
            crumb: data.crumb,
            retryRemaining: verifyAuthCode.MAX_AUTH_RETRY,
            authenticated: false,
            createdAt: data.createTime,
            // 簡訊驗證碼過期時效性
            expiredAt: moment().add(verifyAuthCode.SM_AUTH_CODE_EXPIRATION_MINUTES, "minutes").format("YYYY-MM-DD HH:mm:ss"),
        });
        try {
            const result = await this.redisCacheService.set({ key, value, time: verifyAuthCode.SM_AUTH_CODE_REDIS_EXPIRATION });
            /**
             * 設定 short-message-logs 表資料
             */
            const shortMessageLog = await this.shortMessageLogsService.setVerifyAuthCodeLog({
                msgid: data.msgid,
                phone: data.phone,
                type: verifyAuthCode.SM_AUTH_CODE_SHORT_MESSAGE_LOG_TYPE,
                content: data.content,
                balance: data.balance,
            });
            /**
             * 設定 platform-logs 表資料
             */
            await this.platformLogsService.setVerifyAuthCodeLog({
                level: this.platformLogsService.LEVEL_INFO,
                type: this.platformLogsService.TYPE_VERIFY_AUTH_CODE,
                action: this.platformLogsService.ACTION_SEND_SMS,
                user_id: null,
                administrator_id: null,
                address: {
                    REMOTE_ADDR: data.ip,
                    HTTP_X_FORWARDED_FOR: data.ip,
                },
                target_type: "short_message_logs",
                target_id: shortMessageLog.id,
                payload: data,
            });
            return result;
        } catch (err) {
            return err;
        }
    }

    /**
     * 計算簡訊驗證碼驗證次數
     * 大於指定次數時 此驗證碼無效
     * @param key 取得指定 key 資料
     */
    async getCacheAuthVerifyCodeInfo(key: string): Promise<IverifyCode> {
        try {
            const authVerifyCodeInfo: any = await this.redisCacheService.get(key);
            return JSON.parse(authVerifyCodeInfo);
        } catch (err) {
            return err;
        }
    }
    /**
     * 計算簡訊驗證碼驗證次數
     * 大於指定次數時 此驗證碼無效
     * @param key 取得指定 key 資料
     */
    async setRetryVerifyCodeCount(key: string): Promise<void> {
        // 取得簡訊驗證資料
        const authVerifyCodeInfo: any = await this.getCacheAuthVerifyCodeInfo(key);
        // 判斷是否未通過簡訊驗證 且 可嘗試驗證的次數 大於 0 的情況下 將嘗試次數 減 1
        if (!authVerifyCodeInfo.authenticated && authVerifyCodeInfo.retryRemaining > 0) {
            authVerifyCodeInfo.retryRemaining--;
        }
        // 更新時間
        authVerifyCodeInfo.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");
        await this.redisCacheService.set({
            key,
            value: JSON.stringify(authVerifyCodeInfo),
            time: verifyAuthCode.SM_AUTH_CODE_REDIS_EXPIRATION,
        });
    }

    /**
     * 設定驗證碼驗證成功
     * @param key 取得指定 key 資料
     */
    async setVerifyCodeSuccess(key): Promise<void> {
        // 取得簡訊驗證資料
        const authVerifyCodeInfo: any = await this.getCacheAuthVerifyCodeInfo(key);
        // 設定簡訊驗證成功
        authVerifyCodeInfo.authenticated = true;
        // 更新時間
        authVerifyCodeInfo.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");
        await this.redisCacheService.set({
            key,
            value: JSON.stringify(authVerifyCodeInfo),
            time: verifyAuthCode.SM_AUTH_CODE_REDIS_EXPIRATION,
        });
    }

    /**
     * 生成驗證簡訊驗證碼所需的 crumb
     */
    async createVerifyCodeCrumb(data: { phone: string; time }): Promise<string> {
        const saltOrRounds = 10;
        const nowTime = data.time;
        const hash = await bcrypt.hash(`${data.phone}-${nowTime}`, saltOrRounds);
        return hash;
    }

    /**
     * 驗證簡訊驗證碼 crumb
     */
    async verifyAuthCrumb(data: { phone: string; crumb: string }): Promise<boolean> {
        const authVerifyCodeInfo = await this.getCacheAuthVerifyCodeInfo(`auth:verify-code:${data.phone}`);
        const isMatch = await bcrypt.compare(`${data.phone}-${authVerifyCodeInfo.createdAt}`, data.crumb);
        return isMatch;
    }
    /**
     * 驗證簡訊驗證碼 code
     */
    async verifyAuthCode(data: { phone: string; code: string | number }) {
        const authVerifyCodeInfo = await this.getCacheAuthVerifyCodeInfo(`auth:verify-code:${data.phone}`);
        const isMatch = authVerifyCodeInfo.code == data.code;
        return isMatch;
    }

    /**
     * 發送簡訊驗證碼
     */
    async sendSMSAuthCode(data: { phone: string; ip: string }): Promise<{ phone: string; crumb: string }> {
        // 簡訊驗證資料 redis key
        const redisKey = `auth:verify-code:${data.phone}`;
        // 取得簡訊驗證碼資料
        const authVerifyCodeInfo = await this.getCacheAuthVerifyCodeInfo(redisKey);
        /**
         * 同一號碼未超過指定時間重複請求發送簡訊
         *
         * 判斷 當 redis 有資料時 且
         * 未超過重複發送簡訊等待時間時
         * 不往下執行
         */
        if (authVerifyCodeInfo !== null && moment().valueOf() < moment(authVerifyCodeInfo.expiredAt).valueOf()) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "請稍後再請求驗證碼",
                    error: {
                        error: 1001,
                        msg: "請稍後再請求驗證碼",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 產生驗證碼
        let authCode: string = this.createAuthCode(6);
        // 創建時間
        const createTime = moment().format("YYYY-MM-DD HH:mm:ss");
        // 創建驗證來源的 crumb
        const crumb = await this.createVerifyCodeCrumb({ phone: data.phone, time: createTime });
        // 發送內容
        const content = `${authCode} 是您的 CityBanana 驗證碼`;
        // 判斷是 dev 環境時 不發送簡訊
        if (process.env.NODE_ENV === "development") {
            authCode = "123456";
            // 設定 redis cache 資料
            await this.setCacheAuthVerifyCodeInfo({
                phone: data.phone,
                code: authCode,
                crumb,
                createTime,
                msgid: "測試發送",
                content,
                balance: 0,
                ip: data.ip,
            });
            return { phone: data.phone, crumb };
        }
        try {
            // 發送簡訊驗證碼
            let result = await this.mitakSmsService.sendSms({ dstaddr: data.phone, smbody: content });
            // 將簡訊驗證 api 回傳結果 轉換成物件
            result = await this.mitakSmsService.responseToObject(result);
            // 設定 redis cache 資料
            await this.setCacheAuthVerifyCodeInfo({
                phone: data.phone,
                code: authCode,
                crumb,
                createTime,
                msgid: result.msgid,
                content,
                balance: result.AccountPoint,
                ip: data.ip,
            });
            return { phone: data.phone, crumb };
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "發送簡訊失敗",
                    error: {
                        error: "n13002",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 驗證簡訊驗證碼
     */
    async validatorAuthCode(data: { phone: string; code: string | number; crumb: string }) {
        // 簡訊驗證資料 redis key
        const redisKey = `auth:verify-code:${data.phone}`;

        // 取得簡訊驗證碼資料
        const authVerifyCodeInfo = await this.getCacheAuthVerifyCodeInfo(redisKey);
        if (authVerifyCodeInfo === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "找不到該手機的驗證碼",
                    error: {
                        error: 1019,
                        msg: "找不到該手機的驗證碼",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 驗證 crumb
        const isVerifyCrumb = await this.verifyAuthCrumb({ phone: data.phone, crumb: data.crumb });
        // 驗證 簡訊驗證碼
        const isVerifyCode = await this.verifyAuthCode({ phone: data.phone, code: data.code });

        /**
         * 判斷可重複嘗試次數 大於 0時
         * 以及驗證的 crumb 或 驗證碼 code 比對失敗時觸發
         */
        if (authVerifyCodeInfo.retryRemaining > 0 && (!isVerifyCrumb || !isVerifyCode)) {
            // 將可嘗試驗證次數 減 1
            await this.setRetryVerifyCodeCount(redisKey);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "錯誤的認證碼或 crumb",
                    error: {
                        error: 1003,
                        msg: "錯誤的認證碼或 crumb",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 設定 redis 中 簡訊驗證碼成功
        await this.setVerifyCodeSuccess(redisKey);
        // 手機號碼尋找 user 資料
        const user: any = await this.usersRepository.findOne({ column: "phone", value: data.phone });
        // 當 user 不等於 null 代表此手機號碼是否已被註冊
        if (user !== null) {
            return {
                message: "此手機號碼已被註冊",
                // 判斷是否被停權
                suspended: user.status < 0,
                registered: true,
            };
        }

        // 判斷此號碼已經驗證成功時 不往下執行
        if (authVerifyCodeInfo.authenticated) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此手機號碼驗證碼已被驗證過，無法驗證",
                    error: {
                        error: 1008,
                        msg: "此手機號碼驗證碼已被驗證過，無法驗證",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 當驗證碼超過時效性時 驗證失敗
        if (moment().valueOf() > moment(authVerifyCodeInfo.expiredAt).valueOf() || authVerifyCodeInfo.retryRemaining <= 0) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "尚未通過驗證或操作時間過長，請重新驗證",
                    error: {
                        error: 1005,
                        msg: "尚未通過驗證或操作時間過長，請重新驗證",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }

        return {
            message: "簡訊驗證碼驗證成功",
            suspended: false,
            registered: false,
        };
    }
}
