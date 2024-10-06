import { Order } from "./order.entity";

export const orderProviders = [
    {
        provide: "ORDER_REPOSITORY",
        useValue: Order,
    },
];
