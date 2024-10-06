import { IsNotEmpty, IsEmpty, IsString, IsEmail, Length, IsDateString, IsArray, IsIn, IsInt, IsOptional, IsUrl } from "class-validator";
import { IsNumberOrString } from "src/validator/isNumberOrString.validator";
/**
 * 新增 LINE User 請求資料
 */
export class LineUserDto {
    @IsNotEmpty()
    @IsString()
    midori_id: string;

    @IsOptional()
    @IsNumberOrString("user_id")
    user_id?: null | string | number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsUrl()
    picture: string;

    @IsOptional()
    @IsString()
    status_message?: null | string;
}

/**
 * 更新 LINE User 請求資料
 */
export class LineUserUpdateDto {
    @IsOptional()
    @IsString()
    midori_id?: string;

    @IsOptional()
    @IsNumberOrString("user_id")
    user_id?: null | string | number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsUrl()
    picture?: string;

    @IsOptional()
    @IsString()
    status_message?: null | string;
}
