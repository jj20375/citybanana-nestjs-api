import { Promoters } from "./promoters.entity";

export const promtersProviders = [
    {
        provide: "PROMOTERS_REPOSITORY",
        useValue: Promoters,
    },
];
