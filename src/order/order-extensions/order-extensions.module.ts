import { Module } from "@nestjs/common";
import { orderExtensionProviders } from "./order-extensions.providers";

@Module({
    providers: [...orderExtensionProviders],
})
export class OrderExtensionsModule {}
