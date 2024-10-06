import { InvitationCode } from "./invitation-code.entity";

export const invitationProviders = [
    {
        provide: "INVITATION_CODE_REPOSITORY",
        useValue: InvitationCode,
    },
];
