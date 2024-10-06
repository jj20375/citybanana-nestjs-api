import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "src/auth/auth.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrderBackyardService {
    private phpAPI: string;
    constructor(private readonly http: HttpService, private readonly authService: AuthService, private readonly configService: ConfigService) {
        this.phpAPI = this.configService.get("host.phpAPI");
    }
    /**
     * cms 創建預訂單
     * @example {
     * user_id: 開立即刻快閃活動的使用者 id (type: Number(數字))
     * provider_id: 預訂單對象
     * district: 活動地區 (type: String(字串))
     * location: 活動詳細地點 (type: String(字串))
     * date: 活動開始日期 (type: Date(YYYY-MM-DD 日期格式))
     * time: 活動時間 ( type Date(HH:mm 時間格式))
     * duration: 活動時數 (type: Number(數字))
     * description: 活動內容 (type: String(字串))
     * pay_voucher: 是否使用折抵金 (type: Number(數字)) 傳送值 1 代表使用哲金 0 代表不使用
     * }
     */
    async cmsCreateOrder(data: { user_id: number; provider_id: string; district: string; location: string; date: string; time: string; duration: number; description: string; pay_voucher: number }) {
        const { access_token } = await this.authService.createToken({
            userId: data.user_id,
        });
        const headersRequest = {
            Authorization: `Bearer ${access_token}`,
        };
        console.log(data);
        try {
            const res: any = await this.http
                .post(`${this.phpAPI}/datings`, data, {
                    headers: headersRequest,
                })
                .toPromise();
            return res.data;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: err.response.status,
                    msg: "創建訂單失敗",
                    error: {
                        ...err.response.data,
                    },
                },
                err.response.status,
            );
        }
    }
    /**
     * cms 創建現金預訂單
     * @example {
     * user_id: 開立即刻快閃活動的使用者 id (type: Number(數字))
     * provider_id: 預訂單對象
     * district: 活動地區 (type: String(字串))
     * location: 活動詳細地點 (type: String(字串))
     * date: 活動開始日期 (type: Date(YYYY-MM-DD 日期格式))
     * time: 活動時間 ( type Date(HH:mm 時間格式))
     * duration: 活動時數 (type: Number(數字))
     * description: 活動內容 (type: String(字串))
     * pay_voucher: 是否使用折抵金 (type: Number(數字)) 傳送值 1 代表使用哲金 0 代表不使用
     * }
     */
    async cmsCreateCashPayOrder(data: {
        user_id: number;
        provider_id: string;
        district: string;
        location: string;
        date: string;
        time: string;
        duration: number;
        description: string;
        pay_voucher: number;
    }) {
        const { access_token } = await this.authService.createToken({
            userId: data.user_id,
        });
        const headersRequest = {
            Authorization: `Bearer ${access_token}`,
        };
        console.log(data);
        try {
            const res: any = await this.http
                .post(`${this.phpAPI}/cash/datings`, data, {
                    headers: headersRequest,
                })
                .toPromise();
            return res.data;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: err.response.status,
                    msg: "創建現金付款訂單失敗",
                    error: {
                        ...err.response.data,
                    },
                },
                err.response.status,
            );
        }
    }
}
