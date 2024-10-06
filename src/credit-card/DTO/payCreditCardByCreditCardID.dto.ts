import { IsNotEmpty, IsString } from "class-validator";
import { IsNumberOrString } from "../../validator/isNumberOrString.validator";
// {
//     "amount": "666"
// }

export class PayCreditCardByCreditCardIDDTO {
    // 儲值金額
    @IsNotEmpty()
    @IsNumberOrString("amount")
    amount: string | number;
}
