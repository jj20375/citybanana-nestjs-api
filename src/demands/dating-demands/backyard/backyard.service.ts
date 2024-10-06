import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "src/auth/auth.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DemandsBackyardService {
    private phpAPI: string;
    constructor(private readonly http: HttpService, private readonly authService: AuthService, private readonly configService: ConfigService) {
        this.phpAPI = this.configService.get("host.phpAPI");
    }

    /**
     * cms 創建即刻快閃單
     * @example {
     * user_id: 開立即刻快閃活動的使用者 id (type: Number(數字))
     * name: 活動名稱 (type: String(字串))
     * provider_required: 需求人數 (type: Number(數字))
     * hourly_pay: 每小時出席費 (type: Number(數字))
     * district: 活動地區 (type: String(字串))
     * location: 活動詳細地點 (type: String(字串))
     * due_at: 招募截止時間 (type: Date(YYYY-MM-DD hh:mm 時間格式))
     * started_at: 活動開始時間 (type: Date(YYYY-MM-DD hh:mm 時間格式))
     * duration: 活動時數 (type: Number(數字))
     * description: 活動內容 (type: String(字串))
     * pay_voucher: 是否使用折抵金 (type: Number(數字)) 傳送值 1 代表使用哲金 0 代表不使用
     * }
     */
    async cmsCreateDemands(data: {
        user_id: number;
        name: string;
        provider_required: number;
        hourly_pay: number;
        district: string;
        location: string;
        due_at: string;
        started_at: string;
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
        try {
            const res: any = await this.http
                .post(`${this.phpAPI}/demands/datings`, data, {
                    headers: headersRequest,
                })
                .toPromise();
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    /**
     * cms 創建現金即刻快閃單
     * @example {
     * user_id: 開立即刻快閃活動的使用者 id (type: Number(數字))
     * name: 活動名稱 (type: String(字串))
     * provider_required: 需求人數 (type: Number(數字))
     * hourly_pay: 每小時出席費 (type: Number(數字))
     * district: 活動地區 (type: String(字串))
     * location: 活動詳細地點 (type: String(字串))
     * due_at: 招募截止時間 (type: Date(YYYY-MM-DD hh:mm 時間格式))
     * started_at: 活動開始時間 (type: Date(YYYY-MM-DD hh:mm 時間格式))
     * duration: 活動時數 (type: Number(數字))
     * description: 活動內容 (type: String(字串))
     * pay_voucher: 是否使用折抵金 (type: Number(數字)) 傳送值 1 代表使用哲金 0 代表不使用
     * }
     */
    async cmsCreateCashPayDemands(data: {
        user_id: number;
        name: string;
        provider_required: number;
        hourly_pay: number;
        district: string;
        location: string;
        due_at: string;
        started_at: string;
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
        try {
            const res: any = await this.http
                .post(`${this.phpAPI}/cash/demands/datings`, data, {
                    headers: headersRequest,
                })
                .toPromise();
            return res.data;
        } catch (err) {
            throw err;
        }
    }
}
