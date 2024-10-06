import { IsNotEmpty, IsString, IsBoolean, IsObject } from "class-validator";
import { Transform } from "class-transformer";
export class sendServiceChatMessageDto {
    @IsNotEmpty()
    @IsString()
    receiveUserId: string;

    @IsNotEmpty()
    @IsString()
    message: string;
}
