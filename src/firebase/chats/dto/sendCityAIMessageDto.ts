import { IsNotEmpty, IsString, IsBoolean, IsObject } from "class-validator";
import { Transform } from "class-transformer";
export class sendCityAIMessageDto {
    @IsNotEmpty()
    @IsString()
    loginUserId: string;

    @IsNotEmpty()
    @IsString()
    receiveUserId: string;

    @IsNotEmpty()
    @IsString()
    message: string;
}
