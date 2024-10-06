import { Module } from "@nestjs/common";
import { VoucherLogsService } from "./voucher-logs.service";
import { voucherLogsProviders } from "./voucher-logs.providers";
import { VoucherLogsRepository } from "./voucher-logs.repository";
@Module({
    providers: [VoucherLogsService, ...voucherLogsProviders, VoucherLogsRepository],
    exports: [...voucherLogsProviders, VoucherLogsRepository],
})
export class VoucherLogsModule {}
