import { IsNotEmpty, IsString, IsBoolean, IsOptional } from "class-validator";
import { IsNumberOrString } from "src/validator/isNumberOrString.validator";

// {
//     "is_save": true,
//     "number": "4003551111111111",
//     "expiration": "2601",
//     "cvc": "555",
//     "is_default": false,
//     "amount": "666"
// }

export class CreateCreditCardPayDTO {
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

    // 儲值金額
    @IsNotEmpty()
    @IsNumberOrString("amount")
    amount: string | number;

    // 是否儲存信用卡資訊
    @IsNotEmpty()
    @IsBoolean()
    is_save: boolean;

    // 是否成為預設信用卡
    @IsOptional()
    @IsBoolean()
    is_default: boolean;
}
