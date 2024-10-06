import { Controller, Get, Post, Delete, Param, UseInterceptors, Res, Body, HttpStatus, UseGuards, HttpException, Req } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationInterceptor } from "./notification.interceptor";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { SetReadedNotificationDto } from "./dto/setReadedNotificationDto.dto";
import { ResetUnReadCountDto } from "./dto/resetUnReadCountDto.dto";
import { SetNotificationAllReadedDto } from "./dto/setNotificationAllReadedDto.dto";
import { AddNotificationDataDto } from "./dto/addNotificationDataDto.dto";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";
import { QueueService } from "src/firebase/queue/queue.service";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { SendSystemNotificationDataDto } from "./dto/sendSystemNotificationDataDto.dto";
import { PopupFirestoreService } from "src/firebase/popup-firestore/popup-firestore.service";
import { UserInterceptor } from "src/users/user.interceptor";
@Controller("notification")
export class NotificationController {
    constructor(
        private notificationsService: NotificationService,
        private queueServcie: QueueService,
        private readonly popupFirestoreService: PopupFirestoreService
    ) {}
    // // 將 redis 資料寫入 firestore 方法
    // @Get()
    // async testGet(@Res() res) {
    //     const redisKey = await this.notificationsService.setNotificationDatas();
    //     return res.status(HttpStatus.OK).json({ redisKey });
    // }
    // // 將 redis 資料寫入 firestore 方法 (POSt method)
    // @UseInterceptors(NotificationInterceptor)
    // @Post()
    // async testGet2(@Body() body, @Res() res) {
    //     const redisKey = await this.notificationsService.setNotificationDatas();
    //     // console.log(redisKey, body);
    //     return res.status(HttpStatus.OK).json({ redisKey, body });
    // }

    // 設定單一通知已讀
    @UseGuards(JwtAuthGuard)
    @Post("set-readed")
    async readedNotify(@Body() body: SetReadedNotificationDto, @Res() res) {
        const result = await this.notificationsService.setReadedNotification(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "設定通知已讀失敗",
                error: {
                    error: "n5001",
                },
            },
            HttpStatus.BAD_REQUEST
        );
    }

    // 清空所有未讀通知數量
    @UseGuards(JwtAuthGuard)
    @Post("reset-unread-count")
    async resetUnReadCount(@Body() body: ResetUnReadCountDto, @Res() res) {
        const result = await this.notificationsService.resetUnReadCount(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "設定通知未讀數量歸0失敗",
                error: {
                    error: "n5002",
                },
            },
            HttpStatus.BAD_REQUEST
        );
    }

    // 設定通知預設資料
    @UseGuards(JwtAuthGuard)
    @Post("set-default-data")
    async setDefaultData(@Body() body: ResetUnReadCountDto, @Res() res) {
        const result = await this.notificationsService.setNotificationDefaultData(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "設定通知預設資料失敗",
                error: {
                    error: "n5003",
                },
            },
            HttpStatus.BAD_REQUEST
        );
    }

    // 設定通知全部已讀
    @UseGuards(JwtAuthGuard)
    @Post("set-all-readed")
    async setAllReaded(@Body() body: SetNotificationAllReadedDto, @Res() res) {
        const result = await this.notificationsService.setNotificationAllReaded(body);
        if (result.success) {
            return res.status(HttpStatus.OK).json({ ...result, msg: "全部已讀更新成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "設定通知全部已讀失敗",
                error: {
                    error: "n5004",
                },
            },
            HttpStatus.BAD_REQUEST
        );
    }

    // 新增通知資料 api
    @UseInterceptors(NotificationInterceptor)
    @UseGuards(JwtAuthPHPServerGuard)
    @Post("add-data")
    async addNotificationData(@Body() body: AddNotificationDataDto, @Res() res) {
        const result = await this.notificationsService.addNotificationData({ userId: body.bananaId, addData: body.addData });
        if (result.success) {
            return res.status(HttpStatus.CREATED).json({ ...result, msg: "建立通知資料成功" });
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                msg: "建立通知資料失敗",
                error: {
                    error: "n5005",
                },
            },
            HttpStatus.BAD_REQUEST
        );
    }

    // 取得未付款訂單通知資料
    @UseGuards(JwtAuthGuard)
    @Get("unpay-order")
    async getUnpayOrder(@Req() req, @Res() res) {
        const result = await this.notificationsService.getUnpayOrder({ userId: req.user.sub });
        if (result.length > 0) {
            return res.status(HttpStatus.OK).json(result);
        }
        throw new HttpException(
            {
                statusCode: HttpStatus.NOT_FOUND,
                msg: "沒有未付款的訂單",
                error: {
                    error: "n5006",
                },
            },
            HttpStatus.NOT_FOUND
        );
    }

    /**
     * 系統群發通知 api
     * @param req
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(AdminAuthGuard)
    @Post("send-system-notify")
    async sendSystemNotify(@Req() req, @Body() body: SendSystemNotificationDataDto, @Res() res) {
        console.log(body);
        // 取得 jwt token
        const token = req.headers.authorization.replace("Bearer ", "");
        // 呼叫 cloud functions 使用 queue 方法
        const result = await this.queueServcie.sendSystemNotification({
            ...body,
            token,
            ownerId: req.user.id,
        });
        return res.status(HttpStatus.OK).json(result);
    }

    /**
     * 刪除Popup方法
     * @param params
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @Delete("popup/:loginUserId/:id")
    async deletePopup(@Param() params, @Res() res) {
        const result = await this.popupFirestoreService.deletePopup({
            loginUserId: params.loginUserId,
            id: params.id,
        });
        return res.status(HttpStatus.OK).json(result);
    }

    /**
     * 刪除全域通知方法
     */
    @UseInterceptors(UserInterceptor)
    @UseGuards(JwtAuthGuard)
    @Post("remove/dating-notify")
    async removeDatingNotify(@Res() res, @Req() req, @Body() body: { path: string }) {
        const result = await this.popupFirestoreService.removeDatingNotify(body);
        return res.status(HttpStatus.OK).json(result);
    }
}
