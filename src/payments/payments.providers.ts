import { Payments } from "./payments.entity";

export const paymentsProviders = [
    {
        provide: "PAYMENTS_REPOSITORY",
        useValue: Payments,
    },
];
