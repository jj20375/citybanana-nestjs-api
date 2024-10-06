import { Controller, Post, Get, Req, Res, Body, HttpStatus, UseGuards, HttpException, UseInterceptors, Query, Ip, Param } from "@nestjs/common";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";
import { InvitationCodeVerifyDto } from "../dto/invitation-code-verifyDto.dto";
import { InvitationCodeService } from "../invitation-code.service";
@Controller("invitation-code-server")
export class ServerApiController {
    constructor(private readonly invitationCodeService: InvitationCodeService) {}
    /**
     * Server 端 驗證邀請碼是否有效
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Get("/verify/:code")
    async verifyCode(@Param() params: InvitationCodeVerifyDto, @Res() res) {
        const valid = await this.invitationCodeService.verifyInvitationCodeByServer({ code: params.code });
        return res.status(HttpStatus.OK).json(valid);
    }
}
