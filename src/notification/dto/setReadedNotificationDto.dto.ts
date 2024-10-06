import { IsNotEmpty, IsString } from "class-validator";

export class SetReadedNotificationDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    notificationId: string;
}
