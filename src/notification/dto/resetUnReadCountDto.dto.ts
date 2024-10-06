import { IsNotEmpty, IsString } from "class-validator";

export class ResetUnReadCountDto {
    @IsNotEmpty()
    @IsString()
    userId: string;
}
