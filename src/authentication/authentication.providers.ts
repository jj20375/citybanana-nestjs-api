import { Authentication } from "./authentication.entity";

export const authenticationProviders = [
    {
        provide: "AUTHENTICATION_REPOSITORY",
        useValue: Authentication,
    },
];
