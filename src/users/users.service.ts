import { Injectable, Logger, HttpException, HttpStatus, forwardRef, Inject } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { RedisClient } from "@nestjs/microservices/external/redis.interface";
import { UsersRepository } from "./users.repository";
import moment from "moment";
import glob from "glob";
import { JwtService } from "@nestjs/jwt";
import { AxiosError } from "axios";
import { LoggerService } from "src/logger/logger.service";

@Injectable()
export class UsersService {
    private redisHost: string;
    private redisPort: number;
    public redisClient: RedisClient;
    private phpAPI: string;
    constructor(
        private readonly jwtService: JwtService,
        private readonly http: HttpService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => UsersRepository))
        private readonly usersRpository: UsersRepository,
        @Inject(forwardRef(() => LoggerService))
        private readonly loggerService: LoggerService,
    ) {
        this.redisHost = this.configService.get("redis.redis_host");
        this.redisPort = this.configService.get("redis.redis_port");
        this.redisClient = createClient({
            url: `redis://${this.redisHost}:${this.redisPort}/1`,
        });
        this.phpAPI = this.configService.get("host.phpAPI");
    }

    /**
     * 取得會員瀏覽紀錄
     * @param req 透過headers authorization取得userId, and querystring limit
     * @returns 瀏覽紀錄
     */
    async getMemberHistory(req) {
        const token = req.headers.authorization.replace("Bearer ", "");
        const decode: any = await this.jwtService.decode(token, { complete: true });
        const userId = decode.payload.sub;
        const redisVal: any = await this.getRedisMemberHistoryData("citybanana_database_citybanana_cache:api:recent_visited_providers:" + userId);

        const okData = redisVal.filter((item) => moment(item.updated_at).isAfter(moment().subtract(7, "days")));
        const notokData = redisVal.filter((item) => moment(item.updated_at).isBefore(moment().subtract(7, "days")));

        let updateData = await Promise.all(
            notokData.map(async (e) => {
                const providerHeadersRequest = {
                    authorization: req.headers.authorization,
                };
                try {
                    const result = await this.http.get(`${this.phpAPI}/providers/${e.id}`, { headers: providerHeadersRequest }).toPromise();
                    return {
                        id: result.data.banana_id,
                        cover: result.data.cover,
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    };
                } catch (error) {
                    // 被下架的case 印出來不處理
                    console.log(error.data);
                    // throw new AxiosError(error.response.data);
                }
            }),
        );

        // 去除 null，undefined，empty
        updateData = updateData.filter(Boolean);

        // 合併
        const result = updateData.concat(okData);

        // 排序
        result.sort((a, b) => {
            if (moment(a.updated_at).isAfter(moment(b.updated_at))) {
                return -1;
            }
            if (moment(a.updated_at).isBefore(moment(b.updated_at))) {
                return 1;
            }
            return 0;
        });

        return result.slice(0, req.query["limit"] === undefined ? 30 : req.query["limit"]);
    }

    /**
     * 驗證 redis 中註冊資料
     */
    async verifyRegisterCrumb(data: { phone: string; crumb: string }) {
        try {
            const val: any = await this.getRedisData("citybanana_database_citybanana_cache:api:auth:" + data.phone);
            console.log(val);
            if (data.crumb !== val.crumb && moment().valueOf() > val.verifiedAt) {
                return false;
            }
            return true;
        } catch (err) {
            console.log("解析註冊 redis 資料失敗 =>", err);
            this.loggerService.error({ title: "解析註冊 redis 資料失敗", err });
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    msg: "解析註冊 redis 資料失敗",
                    error: {
                        error: "n3008",
                        msg: err,
                    },
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // 驗證是否為黑名單
    async checkIsBlacklisted(userId: string, token: string): Promise<any> {
        // 當聊天對象是客服時 不觸發
        if (userId === this.configService.get("chat.serviceChatId")) {
            return {
                data: {
                    is_blacklisted: false,
                },
            };
        }
        const headersRequest = {
            Authorization: `${token}`,
        };
        try {
            const res = await this.http.get(`${this.phpAPI}/my/is-blacklisted`, { headers: headersRequest, params: { banana_id: userId } }).toPromise();
            return res.data;
        } catch (err) {
            Logger.log("驗證是否為黑名單失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "驗證是否為黑名單失敗",
                    error: {
                        error: "n3004",
                        // msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得使用者資料
     */
    async getData(userId: string, token: string): Promise<any> {
        const headersRequest = {
            Authorization: `${token}`,
        };

        try {
            const res = await this.http.get(`${this.phpAPI}/backyard/users/${userId}`, { headers: headersRequest }).toPromise();
            return res.data;
        } catch (err) {
            Logger.log("查無使用者資料", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "查無使用者資料",
                    error: {
                        error: "n3006",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 註冊完後執行事件
     * @param { type any(不限制) } user 註冊時的資料
     * @param { type String(字串) } token jwt token
     * @param { type String(字串) } userAgent http header user agent
     */
    async registeredEvents(user: any, token: string, userAgent: string) {
        const headersRequest = {
            Authorization: token,
            "User-Agent": userAgent,
        };
        console.log("註冊event =>", user.dataValues);
        // 發送表單資料
        const form = { ...user.dataValues };
        // 判斷是否有輸入邀請碼 有輸入時才觸發
        if (user.invitation_code !== undefined) {
            form.invitation_code = user.invitation_code;
        }
        try {
            const res = await this.http.post(`${this.phpAPI}/my/registered-events`, form, { headers: headersRequest }).toPromise();
            // console.log(res);
            return { success: true, res };
        } catch (err) {
            console.log(err.response.data);
            console.log("註冊後事件執行失敗 n3013 => ", err);
            this.loggerService.error({
                title: "註冊後事件執行失敗 n3013",
                err,
            });
            Logger.error("註冊後事件執行失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊後事件執行失敗",
                    error: {
                        error: "n3013",
                        msg: err.response.data,
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得服務商列表
     * @param key
     * @returns
     */
    async getProviders(data: { query: any; page: number; limit: number }) {
        data.query.role = 1;
        const users = await this.usersRpository.findAll({ filterOptions: data.query, page: data.page, limit: data.limit });
        return users;
    }

    getRedisMemberHistoryData(key) {
        return new Promise((resolve, reject) => {
            this.redisClient.get(key, (err, val) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                    return;
                }
                if (val === null) {
                    resolve([]);
                    return;
                }

                val = val.replace(/^s:[0-9]{0,}:/, "").replace(";", "");
                val = val.replace(/^"/, "").replace(/"$/g, "");

                try {
                    val = JSON.parse(val);
                    resolve(val);
                } catch (jsonParseError) {
                    resolve([]);
                }
            });
        });
    }

    getRedisData(key) {
        return new Promise((resolve, reject) => {
            this.redisClient.get(key, (err, val) => {
                if (err) {
                    reject(false);
                    return;
                }
                if (val === null) {
                    reject(false);
                    return;
                }

                val = val.replace(/\//, "");
                val = val.replace(/^s:[0-9]{0,}:/, "").replace(";", "");
                val = val.replace(/^"/, "").replace(/"$/g, "");

                try {
                    val = JSON.parse(val);
                    resolve(val);
                } catch (jsonParseError) {
                    resolve(false);
                }
            });
        });
    }
}
