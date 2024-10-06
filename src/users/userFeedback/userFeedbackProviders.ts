import { UserFeedback } from "./userFeedback.entity";

export const userFeedbackProviders = [
    {
        provide: "USERFEEDBACK_REPOSITORY",
        useValue: UserFeedback,
    },
];
