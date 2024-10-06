import { ActivityUser } from "./activity-user.entity";

export const activitiesUserProviders = [
    {
        provide: "ACTIVITY_USER_REPOSITORY",
        useValue: ActivityUser,
    },
];
