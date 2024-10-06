import { PlatformLogs } from "./platform-logs.entity";

export const platformLogsProviders = [
    {
        provide: "PLATFORMLOGS_REPOSITORY",
        useValue: PlatformLogs,
    },
];
