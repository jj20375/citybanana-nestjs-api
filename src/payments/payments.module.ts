import { Module } from "@nestjs/common";
import { NewebpayModule } from "./newebpay/newebpay.module";
import { PaymentsController } from "./payments.controller";
import { paymentsProviders } from "./payments.providers"

@Module({
    imports: [NewebpayModule],
    controllers: [PaymentsController],
    exports: [...paymentsProviders],
    providers: [...paymentsProviders]

})
export class PaymentsModule {}
