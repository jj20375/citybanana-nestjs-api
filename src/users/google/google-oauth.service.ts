import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IGoogleUserAccessToken, IGoogleUserInfo } from "./google-user.interface";
import { OAuth2Client } from "google-auth-library";
import { google, Auth } from "googleapis";
@Injectable()
export class GoogleOauthService {
    oauthClient: any;
    constructor(private readonly configService: ConfigService) {
        const clientID = this.configService.get("socialOauth.googleClientId");
        const clientSecret = this.configService.get("socialOauth.googleSecret");
        this.oauthClient = new OAuth2Client(clientID, clientSecret);
    }

    /**
     * 驗證 access token 是否有效
     * @param { type Object(物件) } data
     * @example {
     *  accessToken: 驗證token { type String(字串) }
     * }
     * @returns
     */
    async authenticate(data: { accessToken: string }): Promise<IGoogleUserAccessToken> {
        try {
            const tokenInfo = await this.oauthClient.getTokenInfo(data.accessToken);
            return tokenInfo;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "檢查 Google access token 失敗",
                    error: {
                        error: "n7001",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * web 端驗證 access token 是否有效
     * @param { type Object(物件) } data
     * @example {
     *  accessToken: 驗證token { type String(字串) }
     * }
     * @returns
     */
    async authenticateByWeb(data: { accessToken: string }): Promise<IGoogleUserInfo> {
        try {
            const ticket: any = await this.oauthClient.verifyIdToken({ idToken: data.accessToken });
            return ticket.payload;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "檢查 Google access token 失敗",
                    error: {
                        error: "n7001",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 取得使用者資料
     */
    async getUserInfo(data: { accessToken: string }): Promise<IGoogleUserInfo> {
        const userInfoClient = google.oauth2("v2").userinfo;
        this.oauthClient.setCredentials({
            access_token: data.accessToken,
        });
        try {
            const userInfoResponse = await userInfoClient.get({
                auth: this.oauthClient,
            });
            return userInfoResponse.data;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "檢查 Google access token 失敗",
                    error: {
                        error: "n7001",
                        msg: err,
                    },
                },
                HttpStatus.FORBIDDEN
            );
        }
    }
}
