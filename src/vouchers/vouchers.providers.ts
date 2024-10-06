import { Vouchers } from "./vouchers.entity";

export const vouchersProviders = [
    {
        provide: "VOUCHERS_PROVIDERS",
        useValue: Vouchers,
    },
];
