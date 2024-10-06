import { GoogleUser } from "./google-user.entity";

export const googleUsersProviders = [
    {
        provide: "GOOGLE_USERS_REPOSITORY",
        useValue: GoogleUser,
    },
];
