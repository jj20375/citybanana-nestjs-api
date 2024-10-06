import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
@Injectable()
export class QueueService {
    constructor(private readonly http: HttpService) {}

    /**
     * 呼叫 cloud functions 執行發送通知功能
     * @param data
     */
    async sendSystemNotification(data: {
        token: string;
        title: string;
        message: string;
        avatar?: string;
        link?: string;
        type: string;
        ownerId: number;
        filterData?: any;
        page: number;
    }): Promise<any> {
        console.log(data);
        try {
            const url = `https://${process.env.CLOUD_FUNCTIONS_REGION_ASIA}-${process.env.GCP_PROJECTID}.cloudfunctions.net/systemNotificationQueueWork`;
            // 本地測試環境用
            // const url = `http://localhost:5001/citybanana-cdbe6/asia-east1/systemNotificationQueueWork`;
            await this.http.post(url, data).toPromise();
            return { success: true };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "發送系統通知失敗",
                    error: {
                        error: "發送系統通知失敗",
                        msg: err.response.data,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
