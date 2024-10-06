import { Controller, Get, Post, Delete, Res, Req, Body, HttpStatus, UseGuards, HttpException, Param, UseInterceptors } from "@nestjs/common";

import { ClientSettingService } from "./client-setting.service";
@Controller("client-setting")
export class ClientSettingController {
    constructor(private clientSettingService: ClientSettingService) {}

    @Get("/ui-switch")
    async getUiSetting(@Res() res) {
        const result = await this.clientSettingService.getUiSetting();
        return res.status(HttpStatus.CREATED).json({ success: true, data: result });
    }
}
