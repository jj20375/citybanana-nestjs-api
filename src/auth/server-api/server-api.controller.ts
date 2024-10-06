import { Controller, Post, Get, Req, Res, Body, HttpStatus, UseGuards, HttpException, UseInterceptors, Query, Ip } from "@nestjs/common";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";
import { AuthService } from "../auth.service";
import { SendVerifyAuthCodeDto, VerifyAuthCodeDto } from "./dto/server-apiDto.dto";

@Controller("auth-server")
export class ServerApiController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Server 端請求發送驗證碼
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Post("send-auth-code")
    async sendAuthCode(@Body() body: SendVerifyAuthCodeDto, @Res() res, @Req() req, @Ip() ip) {
        const result = await this.authService.sendSMSAuthCode({ ...body, ip });
        return res.status(HttpStatus.OK).json(result);
    }

    /**
     * Server 端驗證簡訊驗證碼
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Post("validator-auth-code")
    async validatorAuthCode(@Body() body: VerifyAuthCodeDto, @Res() res) {
        const result = await this.authService.validatorAuthCode(body);
        return res.status(HttpStatus.OK).json(result);
    }
}
