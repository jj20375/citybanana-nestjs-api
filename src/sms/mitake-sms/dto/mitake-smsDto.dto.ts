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

/**
 * 三竹簡訊 api 請求資料格式
 */
export class SendMitakeSMSDto {
    @IsNotEmpty()
    @IsString()
    dstaddr: string;

    @IsNotEmpty()
    @IsString()
    smbody: string;
}
