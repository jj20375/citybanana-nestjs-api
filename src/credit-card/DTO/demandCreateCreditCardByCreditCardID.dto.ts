import { ValidateIf, IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber, Max, Min } from "class-validator";
import { IsNumberOrString } from "../../validator/isNumberOrString.validator";
// 判斷是否開始時間大於結束的機制
import { IsDueAtAfterStartTime } from "../../validator/isDueAtAfterStartTime.validator";
export class DemandCreateCreditCardByCreditCardIDDTO {
    @IsNotEmpty()
    @IsBoolean()
    is_fullAmount: boolean;

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
    provider_required: number;

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
    due_at: Date;

    @IsOptional()
    started_at: Date;

    @IsString()
    description: string;

    @IsString()
    unit: string;
}
