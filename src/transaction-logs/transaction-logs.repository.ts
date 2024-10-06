import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import { TransactionLogs } from "./transaction-logs.entity";
import { IcreateTransactionLogs } from "./transaction-logs.interface";

@Injectable()
export class TransactionLogsRepository {
    constructor(
        @Inject("TRANSACTIONLOGS_REPOSITORY")
        private readonly transactionLogsRepository: typeof TransactionLogs
    ) {}

    async create(data: IcreateTransactionLogs, transaction: Transaction): Promise<TransactionLogs> {
        try {
            const log = await this.transactionLogsRepository.create({ ...data }, { transaction });
            return log;
        } catch (err) {
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "新增交易紀錄資料失敗",
                    error: {
                        error: "n18001",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
