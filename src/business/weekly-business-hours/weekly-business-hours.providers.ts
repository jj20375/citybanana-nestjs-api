import { WeeklyBusinessHours } from "./weekly-business-hours.entity";

export const weeklyBusinessHours = [
    {
        provide: "WEEKLY_BUSINESS_REPOSITORY",
        useValue: WeeklyBusinessHours,
    },
];
