import { IsOptional, IsString, IsInt } from "class-validator";

export class SendSystemNotificationDataDto {
    /**
     * 通知標題
     */
    @IsString()
    title: string;

    /**
     * 通知內容
     */
    @IsString()
    message: string;

    /**
     * 通知圖像
     */
    @IsOptional()
    @IsString()
    avatar?: string;

    /**
     * 通知連結
     */
    @IsOptional()
    @IsString()
    link?: string;

    /**
     * 通知類型
     */
    @IsString()
    type: string;

    /**
     * 過濾條件
     */
    @IsOptional()
    filterData: object;

    /**
     * 分頁
     */
    @IsInt()
    page: number;
}
