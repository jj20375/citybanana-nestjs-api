import { Controller, Get, Post, Put, Res, Body, HttpStatus, HttpException, UseInterceptors, Param, UseGuards, Req, Query } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { UserInterceptor } from "src/users/user.interceptor";
import { NotificationMessagingService } from "../notification/notification-messaging/notification-messaging.service";
import { SendFcmDto } from "./dto/sendFcmDto.dto";

@Controller("fcm")
export class NotificationController {
    constructor(private readonly notificationMessagingService: NotificationMessagingService) {}
    /**
     * 發送 fcm 訊息
     */
    @UseGuards(AdminAuthGuard)
    @Post("/send")
    async sendFcm(@Body() body: SendFcmDto, @Req() req, @Res() res) {
        try {
            const data: any = body;
            await this.notificationMessagingService.sendToUser(data);
            return res.status(HttpStatus.OK).json({ success: true, msg: "發送fcm 訊息成功" });
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "發送 fcm 通知失敗",
                    error: {
                        error: "n5007",
                        msg: "發送 fcm 通知失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
