import { IsNotEmpty, IsString, IsBoolean, IsOptional, Min } from "class-validator";
import { IsNumberOrString } from "../../validator/isNumberOrString.validator";
export class AdvanceCreateCreditCardByCreditCardIDDTO {
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
