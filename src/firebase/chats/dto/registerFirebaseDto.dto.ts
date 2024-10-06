import { IsNotEmpty, IsObject, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
export class RegisterFirebaseDto {
    @IsNotEmpty()
    @IsObject()
    userData: { banana_id: string; phone: string; id: string };

    @IsNotEmpty()
    @IsBoolean()
    @Transform(({ value }) => {
        if ([true, 1].indexOf(value) > -1) {
            return true;
        } else if ([false, 0].indexOf(value) > -1) {
            return false;
        }
    })
    needResetChatToBot: boolean;

    @IsNotEmpty()
    @IsBoolean()
    @Transform(({ value }) => {
        if ([true, 1].indexOf(value) > -1) {
            return true;
        } else if ([false, 0].indexOf(value) > -1) {
            return false;
        }
    })
    needSendWelcomeMessage: boolean;
}
