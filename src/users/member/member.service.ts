import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { AxiosResponse } from "axios";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class MemberService {
    private phpAPI: string;
    constructor(private http: HttpService, private readonly configService: ConfigService) {
        this.phpAPI = this.configService.get("host.phpAPI");
    }

    async getDataApi(userId: string, token: string): Promise<any> {
        const headersRequest = {
            Authorization: `${token}`,
        };
        try {
            const res = await this.http.get(`${this.phpAPI}/users/${userId}`, { headers: headersRequest }).toPromise();
            return res.data;
        } catch (err) {
            Logger.log("取得會員資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得會員資料失敗",
                    error: {
                        error: "n3003",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
            return err;
        }
    }
}
