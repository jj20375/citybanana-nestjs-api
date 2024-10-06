import { IsNotEmpty, IsString, IsBoolean, IsOptional } from "class-validator";
import { IsNumberOrString } from "../../validator/isNumberOrString.validator";
export class AdvanceCreateCreditCardPayDTO {
    // 信用卡卡號(ex: 4003551111111111)
    @IsNotEmpty()
    @IsString()
    number: string;

    // 信用卡到期日yyMM(ex: 2601)
    @IsNotEmpty()
    @IsNumberOrString("expiration")
    expiration: string | number;

    // 信用卡認證碼
    @IsNotEmpty()
    @IsNumberOrString("cvc")
    cvc: string | number;

    //
    @IsOptional()
    @IsString()
    cardholder: string;

    // 是否儲存信用卡資訊
    @IsNotEmpty()
    @IsBoolean()
    is_save: boolean;

    // 是否成為預設信用卡
    @IsOptional()
    @IsBoolean()
    is_default: boolean;

    //
    @IsNotEmpty()
    @IsString()
    provider_id: string;

    @IsNotEmpty()
    @IsNumberOrString("category_id")
    category_id: string | number;

    @IsNotEmpty()
    @IsNumberOrString("duration")
    duration: string | number;

    @IsOptional()
    @IsNumberOrString("tip")
    tip: string | number;

    @IsOptional()
    @IsNumberOrString("pay_voucher")
    pay_voucher: string | number;

    @IsNotEmpty()
    @IsBoolean()
    is_fullAmount: boolean;

    @IsNotEmpty()
    @IsString()
    date: string;

    @IsNotEmpty()
    @IsString()
    time: string;

    @IsNotEmpty()
    @IsString()
    district: string;

    @IsNotEmpty()
    @IsString()
    location: string;

    @IsNotEmpty()
    @IsString()
    description: string;
}
