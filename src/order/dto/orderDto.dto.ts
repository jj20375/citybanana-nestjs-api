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
    IsOptional,
} from "class-validator";
import { IsNumberOrString } from "src/validator/isNumberOrString.validator";

export class CreateOrderDto {
    @IsNotEmpty()
    @IsInt()
    user_id: number;

    @IsNotEmpty()
    @IsNumberOrString("provider_id")
    provider_id: string | number;

    @IsNotEmpty()
    @IsInt()
    category_id: number;

    // 預訂單日期
    @IsNotEmpty()
    @IsDateString()
    date: string;

    // 預訂單時間
    @IsNotEmpty()
    @IsString()
    time: string;

    // 備注
    @IsOptional()
    @IsString()
    description?: string;

    // 區域 ex: 台北市
    @IsNotEmpty()
    @IsString()
    district: string;

    // 準確地點
    @IsNotEmpty()
    @IsString()
    location: string;

    @IsNotEmpty()
    @IsInt()
    duration: number;

    @IsOptional()
    @IsInt()
    tip?: number;

    @IsNotEmpty()
    @IsBoolean()
    pay_voucher: boolean;
}
