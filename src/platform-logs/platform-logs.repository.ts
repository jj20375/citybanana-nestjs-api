import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import { PlatformLogs } from "./platform-logs.entity";

@Injectable()
export class PlatformLogsRepository {
    constructor(
        @Inject("PLATFORMLOGS_REPOSITORY")
        private readonly platformLogsRepository: typeof PlatformLogs
    ) {}

    async findOne(data: { column: string; value: any }): Promise<PlatformLogs> {
        const query = {};
        query[data.column] = data.value;
        const plateformLog = await this.platformLogsRepository.findOne<PlatformLogs>({
            where: query,
        });
        return plateformLog;
    }

    async create(data: any): Promise<PlatformLogs> {
        const result = await this.platformLogsRepository.create(data);
        return result;
    }

    /**
     * 設定開預訂單紀錄
     * @param data
     * @returns
     */
    async setCreateOrderLog(
        data: {
            level: string;
            type: string;
            action: string;
            user_id: number;
            administrator_id: number;
            address: { REMOTE_ADDR: string; HTTP_X_FORWARDED_FOR: string };
            target_type: string;
            target_id: number;
            payload: object;
        },
        transaction: Transaction
    ) {
        try {
            await this.platformLogsRepository.create(data, { transaction });
            return true;
        } catch (err) {
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定開預訂單記錄失敗",
                    error: {
                        error: "n15003",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
