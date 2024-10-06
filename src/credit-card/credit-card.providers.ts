import { CreditCard } from "./credit-card.entity";

export const creditCardProviders = [
    {
        provide: "CREDITCARD_REPOSITORY",
        useValue: CreditCard,
    },
];
