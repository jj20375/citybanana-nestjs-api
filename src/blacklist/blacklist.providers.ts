import { Blacklist } from "./blacklist.entity";

export const blacklistProviders = [
    {
        provide: "BLACKLIST_REPOSITORY",
        useValue: Blacklist,
    },
];
