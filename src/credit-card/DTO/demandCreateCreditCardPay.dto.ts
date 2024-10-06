import { ValidateIf, IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber, Min, Max } from "class-validator";
import { IsNumberOrString } from "../../validator/isNumberOrString.validator";
import { IsDueAtAfterStartTime } from "../../validator/isDueAtAfterStartTime.validator";
export class DemandCreateCreditCardPayDTO {
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

    @IsNotEmpty()
    @IsBoolean()
    is_fullAmount: boolean;

    // 是否儲存信用卡資訊
    @IsNotEmpty()
    @IsBoolean()
    is_save: boolean;

    // 是否成為預設信用卡
    @IsOptional()
    @IsBoolean()
    is_default: boolean;

    @ValidateIf((o) => o.unit === "hour")
    @IsNotEmpty()
    @IsNumber()
    @Min(2000)
    @ValidateIf((o) => o.unit === "day")
    @IsOptional()
    hourly_pay: number | null;

    @IsNotEmpty()
    // FIXME: Read .env
    @Max(10)
    provider_required: string | number;

    @IsNotEmpty()
    @IsNumberOrString("duration")
    duration: string | number;

    @IsOptional()
    @IsNumberOrString("pay_voucher")
    pay_voucher: string | number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    district: string;

    @IsNotEmpty()
    location: string;

    @IsOptional()
    @IsDueAtAfterStartTime("started_at")
    due_at?: Date;

    @IsOptional()
    started_at?: Date;

    @IsString()
    description: string;

    @IsString()
    unit: string;
}
