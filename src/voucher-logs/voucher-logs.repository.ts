import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import { VoucherLogs } from "./voucher-logs.entity";
import { IcreateVoucherLogs } from "./voucher-logs.interface";

export class VoucherLogsRepository {
    constructor(
        @Inject("VOUCHER_LOGS_PROVIDERS")
        private voucherLogsRepository: typeof VoucherLogs
    ) {}

    async create(data: IcreateVoucherLogs, transaction: Transaction): Promise<VoucherLogs> {
        try {
            const voucherLog = await this.voucherLogsRepository.create<VoucherLogs>({ ...data }, { transaction });
            return voucherLog;
        } catch (err) {
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "新增折抵金使用紀錄失敗",
                    error: {
                        error: "n16001",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
