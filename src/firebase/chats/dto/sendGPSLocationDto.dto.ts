import { IsNotEmpty, IsString, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
export class SendGPSLocationDto {
    @IsNotEmpty()
    @IsString()
    loginUserId: string;

    @IsNotEmpty()
    @IsString()
    receiveUserId: string;

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
    lat: string;

    @IsNotEmpty()
    @IsString()
    long: string;
}
