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
    IsNumber,
} from "class-validator";

export class SetVorderDto {
    // 活動開始日期
    @IsNotEmpty()
    @IsDateString()
    startedAt: Date;

    // 活動時長
    @IsNotEmpty()
    @IsNumber()
    duration: number;

    // 活動區域(ex: 台北)
    @IsNotEmpty()
    @IsString()
    district: string;

    // 活動地點(ex: 台北101)
    @IsNotEmpty()
    @IsString()
    location: string;

    // 活動內容
    @IsNotEmpty()
    @IsString()
    description: string;

    // 會員 bananaId
    @IsNotEmpty()
    @IsString()
    memberId: string;

    // 服務商 bananaId
    @IsNotEmpty()
    @IsString()
    providerId: string;

    // 聊天訊息
    @IsNotEmpty()
    @IsString()
    message: string;

    // 判斷是否為服務商
    @IsNotEmpty()
    @IsBoolean()
    isProvider: boolean;
}
