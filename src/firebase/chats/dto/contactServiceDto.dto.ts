import { IsNotEmpty, IsString } from "class-validator";
export class ContactServiceDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    userName: string;
}
