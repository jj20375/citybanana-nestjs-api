import { Injectable, Inject } from "@nestjs/common";
import { Report } from "src/report/report.entity";
import { ReportHelperService } from "src/report/report-helper.service";
import { chartType } from "src/report/report-enum";
import crypto from "crypto";

@Injectable()
export class ReportService {
    constructor(
        @Inject("REPORT_REPOSITORY")
        public reportRepository: typeof Report,
        public readonly reportHelper: ReportHelperService
    ) {}

    async getReports(category = "0"): Promise<any> {
        const sql = `select t1.type, t1.statistics from reports as t1 inner join (
                select type, category, max(created_at) as tt2 from reports 
                where category =  ${category} group by type,category) as t2 on t1.created_at = t2.tt2 and t1.type = t2.type
                where t1.category = ${category};
                `;
        const [results] = await this.reportRepository.sequelize.query(sql);
        const ok: any[] = results;
        return ok;
    }

    /**
     *
     * @returns
     */
    async generateReport(type: string, category: string): Promise<any> {
        switch (type) {
            case chartType.completedOrder:
                return this.reportHelper.lineGraph(type, category);
            case chartType.completedOrderGrossPrice:
                return this.reportHelper.lineGraph(type, category);
            case chartType.popularBookingTimes:
                return this.reportHelper.popularChart(type, category);
            case chartType.proportionOfActivities:
                return this.reportHelper.pieChart(type, category);
            case chartType.proportionOfMeetingCities:
                return this.reportHelper.pieChart(type, category);
            case chartType.orderStatistics:
                return this.reportHelper.statistics(type, category);
            case chartType.bookingCancellationTrend:
                return this.reportHelper.lineGraph(type, category);
            case chartType.incomeStatistics:
                return this.reportHelper.statistics(type, category);
            case chartType.AddUserStatistics:
                return this.reportHelper.statistics(type, category);
            case chartType.customerComplaintStatistics:
                return this.reportHelper.statistics(type, category);
            case chartType.proportionOfCustomerComplaints:
                return this.reportHelper.pieChart(type, category);
            case chartType.proportionOfUrgencyOfCustomerComplaints:
                return this.reportHelper.pieChart(type, category);
            default:
                break;
        }
    }

    async createReport(data: any, type: string, category: string) {
        const reportModel = await this.reportRepository.create<Report>({
            type: type,
            category: category,
            date: Date.now(),
            statistics: data,
            created_at: Date.now(),
            updated_at: Date.now(),
        });
        await reportModel.save();
    }

    async encrypt(data: any) {
        const IV_LENGTH = 16;
        /**
         * 定义加密函数
         * @param {string} data - 需要加密的数据, 传过来前先进行 JSON.stringify(data);
         * @param {string} key - 加密使用的 key
         */
        const aesEncrypt = (data, key) => {
            // 加密規則 ase-256-cbc
            // const iv = crypto.randomBytes(IV_LENGTH);
            // console.log(iv.toString('hex'))
            const cipher = crypto.createCipheriv(process.env.REPORT_ALGORITHM, Buffer.from(key), Buffer.from(process.env.REPORT_HASH_IV, "hex"));
            // 設定 Pkcs7 padding （自動補足缺少位元）
            cipher.setAutoPadding(true);
            let encrypted = cipher.update(data);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            // 將加密後數據 轉換成 hex 字串格式
            return encrypted.toString("hex");
        };

        const payData = JSON.stringify({
            from: "crontab",
            user: "RD",
            scope: "all"
        });
        // 调用加密函数
        let encrypted;
        try {
            encrypted = aesEncrypt(payData, process.env.REPORT_HASH_KEY);
        } catch (error) {
            console.log(error);
            throw new Error("");
        }
        console.log("加密结果: ", encrypted);
        return { encrypted };
    }

    async decrypt(data: string) {
        const encryptedData = data;
        const encryptedText = Buffer.from(encryptedData, "hex");
        const decipher = crypto.createDecipheriv(
            process.env.REPORT_ALGORITHM,
            Buffer.from(process.env.REPORT_HASH_KEY),
            Buffer.from(process.env.REPORT_HASH_IV, "hex")
        );
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        // console.log("解密结果: ", decrypted.toString());
        return decrypted.toString();
    }
}
