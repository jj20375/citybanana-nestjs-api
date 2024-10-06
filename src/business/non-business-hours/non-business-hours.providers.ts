import { NonBusinessHours } from "./non-business-hours.entity";

export const nonBusinessHoursProviders = [
    {
        provide: "NON_BUSINESS_HOURS_REPOSITORY",
        useValue: NonBusinessHours,
    },
];
