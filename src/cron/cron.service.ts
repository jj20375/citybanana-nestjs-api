import { Injectable } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry, Timeout } from "@nestjs/schedule";
import { LoggerService } from "src/logger/logger.service";
import { UsersRepository } from "src/users/users.repository";
import fs from "fs";
import { create } from "xmlbuilder2";
import { SitemapStream, streamToPromise } from "sitemap";
import { ConfigService } from "@nestjs/config";
import { CronJob } from "cron";
import { VorderFirestoreService } from "src/firebase/vorder/vorder-firestore/vorder-firestore.service";

@Injectable()
export class CronService {
    constructor(
        private loggerService: LoggerService,
        private usersRepository: UsersRepository,
        private schedulerRegistry: SchedulerRegistry,
        private configService: ConfigService,
        private vorderFirestoreService: VorderFirestoreService
    ) {}
    /**
     * 每天凌晨 1 點 執行
     * 更新服務商 sitemap
     */
    // @Cron(CronExpression.EVERY_5_SECONDS, {
    //     name: "createProviderSitemap",
    // })
    @Timeout(5000)
    async createProviderSitemap() {
        if (this.configService.get("host.isEnableCron") === "true") {
            const job = new CronJob(CronExpression[this.configService.get("host.cronJobStartTimeProviderSitemap")], async () => {
                console.log(`cron JOB 時間 ${this.configService.get("host.cronJobStartTimeProviderSitemap")}`);
                // 新增 sitemap 資料方法
                const smStream = new SitemapStream({
                    hostname: this.configService.get("host.clientHost"),
                });
                // 新增寫入服務商 sitemap 資料方法
                await this.setProviderSitemapData({ filterOptions: { role: [1] }, nextPage: 1, smStream });
            });
            // 新增 cron job
            this.schedulerRegistry.addCronJob("createProviderSitemap", job);
            job.start();
            // 新增 sitemap 資料方法
            const smStream = new SitemapStream({
                hostname: this.configService.get("host.clientHost"),
            });
            // 新增寫入服務商 sitemap 資料方法
            await this.setProviderSitemapData({ filterOptions: { role: [1] }, nextPage: 1, smStream });

            // 取得執行中 cron job
            // const job = this.schedulerRegistry.getCronJob("createProviderSitemap");
            // 停止 cron job
            // job.stop();
        }
    }

    /**
     * 設定服務商 sitemap 方法
     * @param { type Object(物件) } request 通知資料
     * @example {
     * nextPage: 1 { type: Number (數字) } 分頁頁碼
     * smStream: 寫入 xml 方法 { type:  } 寫入 xml 方法
     * filterOptions: role: [1] { type Object (物件) } 過濾條件
     * }
     */
    async setProviderSitemapData(request: { nextPage: number; smStream: any; filterOptions: any }) {
        try {
            // 取得服務商資料
            const data = await this.usersRepository.findAll({
                filterOptions: { role: [1] },
                page: request.nextPage,
                limit: 100,
            });
            // 新增首頁 sitemap
            request.smStream.write({
                url: "/", // 爬蟲網址
                changefreq: "daily", // 此方式為告訴機器人 此資料為 每天更新的方式 提高爬蟲來爬的次數
                priority: 0.3, // 告訴爬蟲此分數比重 重 0.0 ~ 1 分數越低 權重越高 也就是 優先爬蟲會執行的頁面
            });
            for (let i = 0; i < data.data.length; i++) {
                // sitemap 資料格式
                request.smStream.write({
                    url: "/user?id=" + data.data[i].banana_id, // 爬蟲網址
                    changefreq: "daily", // 此方式為告訴機器人 此資料為 每天更新的方式 提高爬蟲來爬的次數
                    priority: 0.3, // 告訴爬蟲此分數比重 重 0.0 ~ 1 分數越低 權重越高 也就是 優先爬蟲會執行的頁面
                });
            }
            // 判斷非最後一頁時 遞迴設定 sitemap 資料方法
            if (data.last_page !== data.current_page) {
                await this.setProviderSitemapData({
                    smStream: request.smStream,
                    nextPage: data.current_page + 1,
                    filterOptions: { role: [1] },
                });
                return;
            } else {
                // 停止新增 sitemap 資料
                request.smStream.end();
                // sitemap 檔案名稱
                const xmlFileName = "./" + "provider-sitemap" + ".xml";
                // xml 資料格式
                const xml = await streamToPromise(request.smStream);
                fs.writeFileSync(xmlFileName, xml);
                console.log(xml);
                return xml;
            }
        } catch (err) {
            console.log(err);
            return false;
        }
    }
    /**
     * 檢查所有虛擬單並發送 系統帶回復訊息
     */
    @Timeout(5000)
    async checkVorderHaveResponse() {
        if (this.configService.get("host.isEnableCron") === "true") {
            const job = new CronJob(CronExpression[this.configService.get("host.cronJobCheckVorderFeedback")], async () => {
                // 取得未回覆虛擬單並自動回覆
                await this.vorderFirestoreService.vorderFeedback();
                console.log(`cron JOB 檢查所有虛擬單並發送 系統帶回復訊息 時間 ${this.configService.get("host.cronJobCheckVorderFeedback")}`);
            });
            // 新增 cron job
            this.schedulerRegistry.addCronJob("checkVorderFeedback", job);
            job.start();
            // 取得未回覆虛擬單並自動回覆
            await this.vorderFirestoreService.vorderFeedback();
        }
    }
}