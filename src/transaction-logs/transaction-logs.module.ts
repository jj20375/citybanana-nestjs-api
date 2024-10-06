import { Module } from "@nestjs/common";
import { TransactionLogsController } from "./transaction-logs.controller";
import { TransactionLogsService } from "./transaction-logs.service";
import { transactionLogsProviders } from "./transaction-logs.provider";
import { TransactionLogsRepository } from "./transaction-logs.repository";

@Module({
    controllers: [TransactionLogsController],
    exports: [...transactionLogsProviders, TransactionLogsRepository],
    providers: [TransactionLogsService, ...transactionLogsProviders, TransactionLogsRepository],
})
export class TransactionLogsModule {}
