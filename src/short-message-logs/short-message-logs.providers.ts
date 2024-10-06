import { ShortMessageLogs } from "./short-message-logs.entity";

export const shortMessageLogsProviders = [
    {
        provide: "SHORT_MESSAGE_LOGS_REPOSITORY",
        useValue: ShortMessageLogs,
    },
];
