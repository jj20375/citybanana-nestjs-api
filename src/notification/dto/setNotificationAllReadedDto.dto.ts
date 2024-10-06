import { IsNotEmpty, IsString, IsArray } from "class-validator";

export class SetNotificationAllReadedDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsArray()
    notifyIds: [string];
}
