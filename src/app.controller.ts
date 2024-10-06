import { Controller, Get, Res, HttpStatus, UseGuards, Header } from "@nestjs/common";
import { AppService } from "./app.service";
import fs from "fs";
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}
    @Get()
    getHello(@Res() res): object {
        return res.status(HttpStatus.OK).json(this.appService.getHello());
    }

    @Get("/provider-sitemap")
    @Header("Content-Type", "text/xml")
    sitemap(@Res() res) {
        const xml = fs.readFileSync("provider-sitemap.xml");
        return res.status(HttpStatus.OK).send(xml);
    }
}
