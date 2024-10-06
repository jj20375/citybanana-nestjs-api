import { Campaigns } from "./campaigns.entity";

export const campaignsProviders = [
    {
        provide: "CAMPAIGNS_REPOSITORY",
        useValue: Campaigns,
    },
];
