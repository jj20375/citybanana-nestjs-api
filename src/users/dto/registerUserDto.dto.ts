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
import { Match } from "../validator/match.validator";
import { Transform } from "class-transformer";
export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(10, 20)
    phone: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 200)
    name: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsNotEmpty()
    @IsString()
    password?: string | null;

    @IsNotEmpty()
    @IsString()
    @Match("password")
    password_confirmation?: string | null;

    @IsOptional()
    @IsDateString()
    birthday?: Date;

    @IsNotEmpty()
    @IsString()
    @IsIn(["male", "female", "unknown"])
    gender: string;

    @IsOptional()
    @IsInt()
    @IsIn([0, 1])
    marketing_notification?: number;

    @IsNotEmpty()
    @IsArray()
    consent: any[];

    @IsNotEmpty()
    @IsString()
    crumb: string;

    @IsOptional()
    @IsString()
    invitation_code?: string;
}
