import { IsNotEmpty, IsString, IsBoolean, IsObject, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
export class sendChatMessageDto {
    // 登入者 id
    @IsNotEmpty()
    @IsString()
    loginUserId: string;

    // 聊天對象id
    @IsNotEmpty()
    @IsString()
    receiveUserId: string;

    // 聊天對象名稱
    @IsOptional()
    @IsString()
    receiveUserName?: string;

    @IsNotEmpty()
    @IsBoolean()
    @Transform(({ value }) => {
        if ([true, 1].indexOf(value) > -1) {
            return true;
        } else if ([false, 0].indexOf(value) > -1) {
            return false;
        }
    })
    isProvider: boolean;

    @IsNotEmpty()
    @IsString()
    message: string;
}
