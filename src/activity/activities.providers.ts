import { Activity } from "./activities.entity";

export const activitiesProviders = [
    {
        provide: "ACTIVITIES_REPOSITORY",
        useValue: Activity,
    },
];
