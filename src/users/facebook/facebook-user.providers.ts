import { FacebookUser } from "./facebook-user.entity";

export const facebookUsersProviders = [
    {
        provide: "Facebook_USERS_REPOSITORY",
        useValue: FacebookUser,
    },
];
