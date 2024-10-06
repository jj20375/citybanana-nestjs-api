import { HttpService } from "@nestjs/axios";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import jwkToPem from "jwk-to-pem";
import { IAppleUserInfo } from "src/users/apple/apple-user.interface";
@Injectable()
export class AppleOauthService {
    constructor(private readonly configService: ConfigService, private readonly http: HttpService, private readonly jwtService: JwtService) {}
    /**
     * 驗證 identity token 是否有效
     * @param { type Object(物件) } data
     * @example {
     *  identifyToken: 驗證token { type String(字串) }
     * }
     * @returns
     */
    async authenticate(data: { identifyToken: string }): Promise<IAppleUserInfo> {
        // id token
        const token = data.identifyToken;
        try {
            // 解析 token (加上 complete: true 參數，可以解析出 header 以及 signature 資料)
            const decode: any = await this.jwtService.decode(token, { complete: true });
            try {
                // 取得 apple pub keys
                const {
                    data: { keys },
                } = await this.http.get(`${this.configService.get("socialOauth.appleKeysApi")}`).toPromise();
                // 比對 identify token 中 header 使用的 key id
                const key = keys.filter((item) => item.kid === decode.header.kid);
                // 取得 key 資料後 演算生成 pem 格式
                const pem = jwkToPem(key[0]);
                // 將 identify token 與 pem  進行驗證 取得 解析後資料
                const verifyJwt = await this.jwtService.verifyAsync(token, { publicKey: pem, complete: true });
                // 進行資料比對
                if (
                    decode.payload.exp === verifyJwt.payload.exp &&
                    decode.signature === verifyJwt.signature &&
                    decode.payload.iss === verifyJwt.payload.iss &&
                    decode.payload.sub === verifyJwt.payload.sub &&
                    decode.payload.aud === verifyJwt.payload.aud
                ) {
                    return { unique_id: verifyJwt.payload.sub, email: verifyJwt.payload.email };
                } else {
                    throw new HttpException(
                        {
                            statusCode: HttpStatus.FORBIDDEN,
                            msg: "解析 Apple identity token 錯誤",
                            error: {
                                error: "n7005",
                                msg: "解析 Apple identity token 錯誤",
                            },
                        },
                        HttpStatus.FORBIDDEN
                    );
                }
            } catch (err) {
                console.log(err);
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "取得 Apple pub keys 失敗",
                        error: {
                            error: "n7006",
                            msg: err,
                        },
                    },
                    HttpStatus.BAD_REQUEST
                );
            }
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "解析 Apple identity token 錯誤",
                    error: {
                        error: "n7005",
                        msg: err,
                    },
                },
                HttpStatus.FORBIDDEN
            );
        }
    }
}
