import { TransactionLogs } from "./transaction-logs.entity";

export const transactionLogsProviders = [
    {
        provide: "TRANSACTIONLOGS_REPOSITORY",
        useValue: TransactionLogs,
    },
];
