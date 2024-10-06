import { Controller, Get, Post, Res, Body, Query, Param, HttpStatus, HttpException, UseInterceptors, UseGuards, Req, Delete, Patch } from "@nestjs/common";
import { CreditCardService } from "./credit-card.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateCreditCardPayDTO } from "./DTO/createCreditCardPay.dto";
import { PayCreditCardByCreditCardIDDTO } from "./DTO/payCreditCardByCreditCardID.dto";
import { AdvanceCreateCreditCardPayDTO } from "./DTO/advanceCreateCreditCardPay.dto";
import { AdvanceCreateCreditCardByCreditCardIDDTO } from "./DTO/advanceCreateCreditCardByCreditCardID.dto";
import { DemandCreateCreditCardPayDTO } from "./DTO/demandCreateCreditCardPay.dto";
import { DemandCreateCreditCardByCreditCardIDDTO } from "./DTO/demandCreateCreditCardByCreditCardID.dto";
import { UserInterceptor } from "src/users/user.interceptor";

@Controller("credit-card")
export class CreditCardController {
    constructor(private CreditCardService: CreditCardService) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Get("/")
    async getCreditCards(@Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.getCreditCards(req.headers.authorization);
        return res.status(HttpStatus.OK).json({ data });
    }

    // 儲值並新增信用卡
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/")
    async createCreditCardPay(@Body() body: CreateCreditCardPayDTO, @Req() req, @Res() res) {
        const data = await this.CreditCardService.creditCardAndCreate(req.headers.authorization, body, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    // 以指定已儲存信用卡儲值
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/creditcards/:creditCardID")
    async payCreditCardByCreditCardID(@Body() body: PayCreditCardByCreditCardIDDTO, @Req() req, @Res() res, @Param() params) {
        console.log(req.headers.authorization, body, params.creditCardID, req);
        const data = await this.CreditCardService.payCreditCardByCreditCardID(req.headers.authorization, body, params.creditCardID, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    // 支付預約費用並新增信用卡
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/advance")
    async advanceCreateCreditCardPay(@Body() body: AdvanceCreateCreditCardPayDTO, @Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.advanceCreateCreditCardPay(req.headers.authorization, body, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    // 以指定已儲存信用卡預約費用
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/advance/creditcards/:creditCardID")
    async advanceCreateCreditCardByCreditCardID(@Body() body: AdvanceCreateCreditCardByCreditCardIDDTO, @Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.advanceCreateCreditCardByCreditCardID(req.headers.authorization, body, params.creditCardID, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    // 支付即可快閃費用並新增信用卡
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/demands")
    async demandsCreateCreditCardPay(@Body() body: DemandCreateCreditCardPayDTO, @Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.demandsCreateCreditCardPay(req.headers.authorization, body, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    // 以指定已儲存信用卡支付即可快閃費用
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/demands/creditcards/:creditCardID")
    async demandsCreateCreditCardByCreditCardID(@Body() body: DemandCreateCreditCardByCreditCardIDDTO, @Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.demandsCreateCreditCardByCreditCardID(req.headers.authorization, body, params.creditCardID, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Delete("/:creditCardID")
    async deleteCreditCard(@Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.deleteCreditCard(req.headers.authorization, params.creditCardID, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Patch("/:creditCardID")
    async settingDefaultCreditCard(@Req() req, @Res() res, @Param() params) {
        const data = await this.CreditCardService.settingDefaultCreditCard(req.headers.authorization, params.creditCardID, req);
        return res.status(HttpStatus.OK).json({ data });
    }

    @Post("/notify")
    async notify(@Req() req, @Res() res) {
        const data = await this.CreditCardService.notify(req.body, req);
        return res.status(HttpStatus.OK).json({ data });
    }
}
