import { AdministratorUser } from "./administrator-user.entity";

export const administratorUsersProviders = [
    {
        provide: "ADMINISTRATOR_USERS_REPOSITORY",
        useValue: AdministratorUser,
    },
];
