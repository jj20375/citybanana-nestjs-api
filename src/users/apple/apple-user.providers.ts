import { AppleUser } from "./apple-user.entity";

export const appleUsersProviders = [
    {
        provide: "APPLE_USERS_REPOSITORY",
        useValue: AppleUser,
    },
];
