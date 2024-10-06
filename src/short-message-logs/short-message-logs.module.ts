import { Module } from "@nestjs/common";
import { ShortMessageLogsService } from "./short-message-logs.service";
import { shortMessageLogsProviders } from "./short-message-logs.providers";
import { ShortMessageLogRepository } from "./short-message-logs.repository";

@Module({
    providers: [ShortMessageLogsService, ...shortMessageLogsProviders, ShortMessageLogRepository],
    exports: [ShortMessageLogsService, ...shortMessageLogsProviders, ShortMessageLogRepository],
})
export class ShortMessageLogsModule {}
