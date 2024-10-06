import { Module } from "@nestjs/common";
import { PlatformLogsService } from "./platform-logs.service";
import { PlatformLogsController } from "./platform-logs.controller";
import { platformLogsProviders } from "./platform-logs.provider";
import { PlatformLogsRepository } from "./platform-logs.repository";
@Module({
    providers: [PlatformLogsService, ...platformLogsProviders, PlatformLogsRepository],
    exports: [...platformLogsProviders, PlatformLogsRepository, PlatformLogsService],
    controllers: [PlatformLogsController],
})
export class PlatformLogsModule {}
