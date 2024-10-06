import { IsNotEmpty, IsString, IsObject, IsEmpty, IsBoolean, IsNumber } from "class-validator";
import { IsStringNotEmpty } from "../validator/isStringNotEmpty.validator";
import { Transform } from "class-transformer";
export class AuthenticationUpdateDto {
    @IsNotEmpty()
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsNumber()
    status: number;

    @IsStringNotEmpty("comment")
    comment?: string;
}
