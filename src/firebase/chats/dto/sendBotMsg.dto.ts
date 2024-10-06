import { IsNotEmpty, IsString, IsObject, IsEmpty, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
export class SendBotMsgDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsObject()
    userData: {
        any: any;
        name: string;
    };

    @IsNotEmpty()
    @IsBoolean()
    @Transform(({ value }) => {
        if ([true, 1].indexOf(value) > -1) {
            return true;
        } else if ([false, 0].indexOf(value) > -1) {
            return false;
        }
    })
    isProvider: boolean;

    @IsNotEmpty()
    @IsObject()
    botMessages: object;

    @IsNotEmpty()
    @IsString()
    messageKey: string;

    @IsNotEmpty()
    @IsString()
    questionText: string;
}
