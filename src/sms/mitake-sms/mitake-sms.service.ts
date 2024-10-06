import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "src/auth/auth.service";
import { IMitakeSmSendResponse } from "./interface/mitake-sms.interface";
@Injectable()
export class MitakeSmsService {
    private apiConfig;
    private username;
    private password;
    constructor(
        readonly configService: ConfigService,
        private http: HttpService,
        @Inject(forwardRef(() => AuthService))
        private authService: AuthService
    ) {
        this.apiConfig = this.configService.get("mitake-sms.apiConfig");
        this.username = this.configService.get("mitake-sms.username");
        this.password = this.configService.get("mitake-sms.password");
    }

    /**
     *
     * @param data
     * @example {
     * dstaddr: 手機號碼
     * smbody: 簡訊內容
     * destname: 收簡訊人名稱
     * }
     * @returns
     */
    async sendSms(data: { dstaddr: string; smbody: string; destname?: string }) {
        // 有傳送中文時需要將發送資料 url encode utf8 格式
        data.smbody = encodeURI(data.smbody);
        // 參數值
        let uri = `?username=${this.username}&password=${this.password}&dstaddr=${data.dstaddr}&smbody=${data.smbody}`;
        // 判斷有傳送收簡訊人名稱時觸發
        if (data.destname) {
            // 有傳送中文時需要將發送資料 url encode utf8 格式
            data.destname = encodeURI(data.destname);
            uri += `&destname=${data.destname}`;
        }
        // 將發送格式設定為 utf 8
        uri += `&CharsetURL=UTF-8`;
        const headersRequest = {
            "Content-Type": "application/x-www-form-urlencoded",
        };
        try {
            const result = await this.http.post(`${this.apiConfig}/SmSend${uri}`, {}, { headers: headersRequest }).toPromise();
            return result.data;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "發送簡訊失敗",
                    error: {
                        error: "n13001",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得剩餘點數
     */
    async getPoint(): Promise<number> {
        // 參數值
        const uri = `?username=${this.username}&password=${this.password}`;
        const headersRequest = {
            "Content-Type": "application/x-www-form-urlencoded",
        };
        try {
            const result = await this.http.post(`${this.apiConfig}/SmSend${uri}`, {}, { headers: headersRequest }).toPromise();
            return result.data;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得間訓剩餘額度失敗",
                    error: {
                        error: "n13004",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 將 三竹簡訊 api 返回值 轉換成 object
     * @param data
     * @returns
     */
    async responseToObject(data: string): Promise<IMitakeSmSendResponse> {
        const result: any = {};
        const matchClientId = data.match(/\[\d\]/g);
        if (matchClientId !== null) {
            result.clientid = JSON.parse(matchClientId[0]);
        }
        const matchMsgid: any = data.match(/.*msgid=\d.*/g);
        if (matchMsgid !== null) {
            result.msgid = matchMsgid[0].replace(/msgid=/g, "");
        }
        const matchStatuscode: any = data.match(/.*statuscode=\d.*/g);
        if (matchStatuscode !== null) {
            result.statuscode = parseInt(matchStatuscode[0].replace(/statuscode=/g, ""));
        }
        const matchAccountPoint: any = data.match(/.*AccountPoint=\d.*/g);
        if (matchAccountPoint !== null) {
            result.AccountPoint = parseInt(matchAccountPoint[0].replace(/AccountPoint=/g, ""));
        }
        return result;
    }
}
