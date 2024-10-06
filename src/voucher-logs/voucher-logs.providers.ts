import { VoucherLogs } from "./voucher-logs.entity";

export const voucherLogsProviders = [
    {
        provide: "VOUCHER_LOGS_PROVIDERS",
        useValue: VoucherLogs,
    },
];
