import { IsNotEmpty, IsArray, IsString, IsNumber } from "class-validator";
export class SendNotifyMessagesDto {
    @IsNotEmpty()
    @IsArray()
    userIds: [{ banana_id: string; id: string }];

    @IsNotEmpty()
    @IsNumber()
    ownerId: number;

    @IsNotEmpty()
    @IsString()
    message: string;

    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @IsString()
    type: string;
}
