import { IsNotEmpty, IsString, IsObject } from "class-validator";

export class AddNotificationDataDto {
    @IsNotEmpty()
    @IsString()
    bananaId: string;

    @IsNotEmpty()
    @IsObject()
    addData: object;
}
