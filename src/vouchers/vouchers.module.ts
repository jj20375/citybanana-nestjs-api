import { Module } from "@nestjs/common";
import { VouchersService } from "./vouchers.service";
import { vouchersProviders } from "./vouchers.providers";
import { VouchersRepository } from "./vouchers.repository";

@Module({
    providers: [VouchersService, ...vouchersProviders, VouchersRepository],
    exports: [...vouchersProviders, VouchersRepository],
})
export class VouchersModule {}
