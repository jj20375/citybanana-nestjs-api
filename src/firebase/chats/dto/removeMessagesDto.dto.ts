import { IsNotEmpty, IsString } from "class-validator";
export class RemoveMessagesDto {
    @IsNotEmpty()
    @IsString()
    loginUserId: string;

    @IsNotEmpty()
    @IsString()
    receiveUserId: string;
}
