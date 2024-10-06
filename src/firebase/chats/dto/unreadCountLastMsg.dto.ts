import { IsNotEmpty, IsString, IsBoolean, IsObject } from "class-validator";
import { Transform } from "class-transformer";
export class UnreadCountLastMsg {
    @IsNotEmpty()
    @IsString()
    loginUserId: string;

    @IsNotEmpty()
    @IsString()
    receiveUserId: string;

    @IsNotEmpty()
    @IsObject()
    loginUserData: object;

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
    @IsString()
    message: string;
}
