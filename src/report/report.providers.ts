import { Report } from "./report.entity";

export const reportProviders = [
    {
        provide: "REPORT_REPOSITORY",
        useValue: Report,
    },
];
