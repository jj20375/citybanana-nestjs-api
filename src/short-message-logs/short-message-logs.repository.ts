import { Injectable, Inject } from "@nestjs/common";
import { ShortMessageLogs } from "./short-message-logs.entity";

@Injectable()
export class ShortMessageLogRepository {
    constructor(
        @Inject("SHORT_MESSAGE_LOGS_REPOSITORY")
        private readonly shortMessageLogsRepository: typeof ShortMessageLogs
    ) {}

    async findOne(data: { column: string; value: any }): Promise<ShortMessageLogs> {
        const query = {};
        query[data.column] = data.value;
        try {
            const shortMessageLog = await this.shortMessageLogsRepository.findOne<ShortMessageLogs>({
                where: query,
            });
            return shortMessageLog;
        } catch (err) {
            return err;
        }
    }

    async create(data: any): Promise<ShortMessageLogs> {
        try {
            const shortMessageLog = await this.shortMessageLogsRepository.create<ShortMessageLogs>(data);
            return shortMessageLog;
        } catch (err) {
            console.log(err);
            return err;
        }
    }
}
