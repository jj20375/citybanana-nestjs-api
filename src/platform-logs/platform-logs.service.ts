import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import { PlatformLogsRepository } from "./platform-logs.repository";
@Injectable()
export class PlatformLogsService {
    // info log 型別
    public LEVEL_INFO = "info";
    // 簡訊驗證 type
    public TYPE_VERIFY_AUTH_CODE = "short message";
    // 觸發 log 方法
    public ACTION_SEND_SMS = "send";
    // 預訂單 type
    public TYPE_DATINGS = "dating";
    // 觸發 log 方法
    public ACTION_CREATE = "create";

    constructor(private readonly platformLogsRepository: PlatformLogsRepository) {}

    /**
     * 設定簡訊驗證碼發送紀錄
     * @param data
     * @returns
     */
    async setVerifyAuthCodeLog(data: any) {
        try {
            await this.platformLogsRepository.create(data);
            return true;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定簡訊驗證記錄失敗",
                    error: {
                        error: "n15002",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
