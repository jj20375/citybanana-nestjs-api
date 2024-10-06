import { OrderExtension } from "./order-extensions.entity";

export const orderExtensionProviders = [
    {
        provide: "ORDER_EXTENSION_REPORSITORY",
        useValue: OrderExtension,
    },
];
