import { IsNotEmpty, IsEmpty, IsString, IsEmail, Length, IsDateString, IsArray, IsIn, IsInt, IsOptional } from "class-validator";
export class RegisterAppleOauthUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(10, 20)
    phone: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 200)
    name: string;

    @IsNotEmpty()
    @IsString()
    id_token: string;

    @IsOptional()
    @IsEmail()
    email?: string;

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
