import { DatingDemandEnrollers } from "./dating-demands-enrollers.entity";

export const datingDemandEnrollersProviders = [
    {
        provide: "DATING_DEMAND_ENROLLERS_REPOSITORY",
        useValue: DatingDemandEnrollers,
    },
];
