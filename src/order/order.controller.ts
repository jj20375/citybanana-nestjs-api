import { Controller, Get, Post, Body, Param, Req, Res, UseGuards, HttpStatus, HttpException, Delete, UseInterceptors, Query, Ip } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { VorderFirestoreHelperService } from "src/firebase/vorder/vorder-firestore/vorder-firestore-helper/vorder-firestore-helper.service";
import { VorderFirestoreService } from "src/firebase/vorder/vorder-firestore/vorder-firestore.service";
import { UserInterceptor } from "src/users/user.interceptor";
import { SetVorderDto } from "./dto/setVorderDto.dto";
import { OrderService } from "./order.service";
import { OrderEventProducer } from "./events/order-event.producer";
import { CreateOrderDto } from "./dto/orderDto.dto";
import { TransactionParam } from "src/database/database-transaction.decorator";
import { Transaction } from "sequelize";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
@Controller("order")
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly vorderFirestoreService: VorderFirestoreService,
        private readonly vorderFirstoreHelperService: VorderFirestoreHelperService,
        private readonly orderEventProducer: OrderEventProducer,
    ) {}
    /**
     * 發送詢問單方法
     * @param body
     * @param res
     * @param req
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("set-vorder")
    async setVorder(@Body() body: SetVorderDto, @Res() res, @Req() req) {
        await this.vorderFirestoreService.setVorderAndSendMessage({
            ...body,
            memberName: req.userData.name,
        });
        return res.status(HttpStatus.OK).json({ success: true });
    }
    /**
     * 取得詢問單方法
     * @param params
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @Get("/vorder/:loginUserId/:receiveUserId")
    async getVorder(@Param() params, @Res() res) {
        const vorder = await this.vorderFirestoreService.getVorder({
            loginUserId: params.loginUserId,
            receiveUserId: params.receiveUserId,
        });
        return res.status(HttpStatus.OK).json(vorder);
    }
    /**
     * 刪除詢問單方法
     * @param params
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @Delete("/vorder/:memberId/:providerId")
    async deleteVorder(@Param() params, @Res() res) {
        const result = await this.vorderFirestoreService.deleteVorder({
            loginUserId: params.memberId,
            receiveUserId: params.providerId,
        });
        return res.status(HttpStatus.OK).json({ ...result });
    }

    @Get("")
    async getOrder(@Res() res, @Query() query) {
        this.orderEventProducer.created(query);
        return res.status(HttpStatus.OK).json(query);
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @UseInterceptors(TransactionInterceptor)
    @Post("create")
    async createOrder(@Body() body: CreateOrderDto, @Res() res, @Req() req, @TransactionParam() transaction: Transaction, @Ip() ip) {
        // body.memberData = req.userData;
        const saveData = {
            ...body,
            ip: ip,
            memberData: req.userData,
        };
        const data = await this.orderService.create(saveData, transaction);
        return res.status(HttpStatus.OK).json(data);
    }

    /**
     * 取得詢問單方法
     * @param params
     * @param res
     * @returns
     */
    @UseGuards(AdminAuthGuard)
    @Get("/vorder-report")
    async getVorderReport(@Param() params, @Res() res) {
        const vorders = await this.vorderFirestoreService.getVorderReport();
        return res.status(HttpStatus.OK).json(vorders);
    }
}
