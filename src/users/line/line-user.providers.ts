import { LineUser } from "./line-user.entity";

export const lineUsersProviders = [
    {
        provide: "LINE_USERS_REPOSITORY",
        useValue: LineUser,
    },
];
