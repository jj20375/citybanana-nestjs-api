import { DatingDemands } from "./dating-demands.entity";

export const datingDemandsProviders = [
    {
        provide: "DATING_DEMANDS_REPOSITORY",
        useValue: DatingDemands,
    },
];
