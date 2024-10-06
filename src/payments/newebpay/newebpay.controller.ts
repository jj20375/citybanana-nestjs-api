import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserInterceptor } from "src/users/user.interceptor";
import { NewebpayService } from "./newebpay.service";

@Controller("newebpay")
export class NewebpayController {
    constructor(private readonly newebpayService: NewebpayService) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(UserInterceptor)
    @Post("/credit-card/pay")
    async runPay(@Body() body, @Res() res, @Req() req) {
        const result = await this.newebpayService.encrypt({ ...body, userId: req.user.sub, P3D: req.userData.status === 2 ? "0" : "1" });
        const decryptedData = await this.newebpayService.decrypt({ value: result.encrypted });
        const result2 = await this.newebpayService.runPay(result.encrypted);
        return res.status(HttpStatus.OK).send(result2.data);
    }
}
