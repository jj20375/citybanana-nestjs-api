import { Body, Controller, HttpStatus, Post, Res, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { OrderBackyardService } from "./backyard.service";

@Controller("/backyard/order")
export class BackyardController {
    constructor(private readonly orderService: OrderBackyardService) {}
    // 儲值金付款 api
    @UseGuards(AdminAuthGuard)
    @Post("/create")
    async create(@Body() body: any, @Res() res) {
        const order = await this.orderService.cmsCreateOrder(body);
        return res.status(HttpStatus.CREATED).json(order);
    }
    // 現金付款 api
    @UseGuards(AdminAuthGuard)
    @Post("/create-by-cashpay")
    async createByCashPay(@Body() body: any, @Res() res) {
        const order = await this.orderService.cmsCreateCashPayOrder(body);
        return res.status(HttpStatus.CREATED).json(order);
    }
}
