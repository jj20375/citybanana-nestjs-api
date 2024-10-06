import { IsNotEmpty, IsString } from "class-validator";
export class GoogleMapSearchDto {
    // 搜尋值
    @IsNotEmpty()
    @IsString()
    value: string;
}
