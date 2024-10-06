import { BusinessHours } from "./business-hours.entity";

export const businessHoursProviders = [
    {
        provide: "BUSINESS_HOURS_REPOSITORY",
        useValue: BusinessHours,
    },
];
