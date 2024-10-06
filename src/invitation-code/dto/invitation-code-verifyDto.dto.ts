import { Matches, IsString } from "class-validator";

export class InvitationCodeVerifyDto {
    @Matches(/^i[a-z0-9]{9}$/, { message: "$property must match regex expression" })
    @IsString()
    code: string;
}
