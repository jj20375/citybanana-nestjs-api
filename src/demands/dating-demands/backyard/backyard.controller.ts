import { Controller, Get, Post, Put, Res, Body, HttpStatus, HttpException, UseInterceptors, Param, UseGuards, Req, Query } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { DemandsBackyardService } from "./backyard.service";

@Controller("backyard/demands")
export class BackyardController {
    constructor(private readonly datingDemandsService: DemandsBackyardService) {}
    /**
     * 儲值金開立即刻快閃單
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(AdminAuthGuard)
    @Post("/create")
    async create(@Body() body: any, @Res() res) {
        const order = await this.datingDemandsService.cmsCreateDemands(body);
        return res.status(HttpStatus.CREATED).json(order);
    }

    /**
     * 現金開立即刻快閃單
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(AdminAuthGuard)
    @Post("/create-by-cashpay")
    async createByCashPay(@Body() body: any, @Res() res) {
        const order = await this.datingDemandsService.cmsCreateCashPayDemands(body);
        return res.status(HttpStatus.CREATED).json(order);
    }
}
