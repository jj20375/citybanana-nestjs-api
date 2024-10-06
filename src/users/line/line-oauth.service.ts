import { HttpService } from "@nestjs/axios";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ILineOauthInfo } from "./line-oauth.interface";
import { ILineFriendshipInfo } from "./line-friendship.interface";
import { LoggerService } from "src/logger/logger.service";
// ajax 模擬表單發送
import FormData from "form-data";

@Injectable()
export class LineOauthService {
    constructor(private readonly configService: ConfigService, private readonly http: HttpService, private loggerService: LoggerService) {}
    /**
     * 驗證 access token 是否有效
     * @param { type Object(物件) } data
     * @example {
     *  accessToken: 驗證token { type String(字串) }
     * }
     * @returns ILineOauthInfo
     */
    async authenticate(data: { accessToken: string }): Promise<ILineOauthInfo> {
        try {
            const result = await this.http
                .get(`${this.configService.get("socialOauth.lineProfileApi")}`, {
                    headers: {
                        authorization: data.accessToken,
                    },
                })
                .toPromise();

            return result.data;
        } catch (err) {
            this.loggerService.error({ msg: err.response.data, token: data.accessToken });
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "檢查 LINE access token 失敗",
                    error: {
                        error: "n7003",
                        msg: err.response.data,
                    },
                },
                HttpStatus.FORBIDDEN
            );
        }
    }

    /**
     * LINE 驗證 access token api
     * @param { type Object(物件) } data
     * @example {
     *  accessToken: 驗證token { type String(字串) }
     * }
     */
    async verifyAccessToken(data: { accessToken: string }): Promise<any> {
        try {
            const bodyFormData = new FormData();
            bodyFormData.append("access_token", data.accessToken);

            const result = await this.http
                .post(`${this.configService.get("socialOauth.lineVerifyAccessToken")}`, bodyFormData, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                })
                .toPromise();
            return result.data;
        } catch (err) {
            this.loggerService.error({ msg: err.response.data, token: data.accessToken });
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "檢查 LINE access token 失敗2",
                    error: {
                        error: "n7003",
                        msg: err.response.data,
                    },
                },
                HttpStatus.FORBIDDEN
            );
        }
    }

    /**
     * Getting the friendship status of the user and the LINE Official Account
     * @param { type Object(物件) } data
     * @example {
     *  accessToken: 驗證token { type String(字串) }
     * }
     * @returns ILineFriendshipInfo
     */
    async getFriendshipStatus(data: { accessToken: string }): Promise<ILineFriendshipInfo> {
        try {
            const result = await this.http
                .get(`${this.configService.get("socialOauth.lineFriendshipStatusApi")}`, {
                    headers: {
                        authorization: data.accessToken,
                    },
                })
                .toPromise();
            return result.data;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "檢查 LINE friendship status 失敗",
                    error: {
                        error: "n7017",
                        msg: err.response.data,
                    },
                },
                HttpStatus.FORBIDDEN
            );
        }
    }
}
