import { Controller, Post, Get, Req, Res, Body, HttpStatus, UseGuards, HttpException, UseInterceptors } from "@nestjs/common";
import { SendMitakeSMSDto } from "./dto/mitake-smsDto.dto";
import { MitakeSmsService } from "./mitake-sms.service";

@Controller("mitake-sms")
export class MitakeSmsController {
    constructor(private readonly mitakeService: MitakeSmsService) {}

    @Post("/send")
    async send(@Body() body: SendMitakeSMSDto, @Res() res) {
        const result = await this.mitakeService.sendSms({ ...body });
        return res.set({ "content-type": "text/html; charset=utf-8" }).status(HttpStatus.OK).json(result);
    }
}
