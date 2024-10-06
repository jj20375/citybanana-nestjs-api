import {
    IsNotEmpty,
    IsString,
    IsEmail,
    Length,
    IsDate,
    IsDateString,
    IsObject,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsEmpty,
    IsOptional,
} from "class-validator";
import { IsNumberOrString } from "src/validator/isNumberOrString.validator";

/**
 * 發送簡訊驗證碼 請求資料
 */
export class SendVerifyAuthCodeDto {
    @IsNotEmpty()
    @IsString()
    phone: string;
}

/**
 * 簡訊驗證碼驗證時 請求資料
 */
export class VerifyAuthCodeDto {
    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsNumberOrString("code")
    code: string | number;

    @IsNotEmpty()
    @IsString()
    crumb: string;
}
