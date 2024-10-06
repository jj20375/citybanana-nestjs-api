import { IsNotEmpty, IsString, IsObject, IsEmpty, IsBoolean, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class SendFcmDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsObject()
    setData: { title: string; message: string };

    @IsNotEmpty()
    @IsString()
    type: string;
}
