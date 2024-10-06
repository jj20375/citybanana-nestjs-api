import { Controller, Get, Post, Res, Body, Query, Param, HttpStatus, HttpException, UseInterceptors, UseGuards, Req } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { ReportService } from "./report.service";

@Controller("report")
export class ReportController {
    constructor(private ReportService: ReportService) {}

    @UseGuards(AdminAuthGuard)
    @Get("/:category")
    async getReport(@Req() req, @Res() res, @Param() params) {
        try {
            const data = await this.ReportService.getReports(params.category);
            return res.status(HttpStatus.OK).json({ data });
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得數據中心資料失敗",
                    error: {
                        error: "n11001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    @Post("/:type/:category")
    async createReport(@Req() req, @Res() res, @Param() params, @Query() query) {
        try {
            const data = await this.ReportService.decrypt(query.key);
            const apiKeyPayload = JSON.parse(data);
            if (apiKeyPayload.from === "crontab" && apiKeyPayload.user === "citybanana") {
                const chartCount = 11;
                const timeCategory = 10;

                for (let t = 0; t <= timeCategory; t++) {
                    for (let c = 0; c <= chartCount; c++) {
                        const data = await this.ReportService.generateReport(c.toString(), t.toString());
                        await this.ReportService.createReport(data, c.toString(), t.toString());
                    }
                }

                return res.status(HttpStatus.OK).json({});
            } else if (apiKeyPayload.from === "crontab" && apiKeyPayload.user === "RD") {
                const data = await this.ReportService.generateReport(params.type, params.category);
                await this.ReportService.createReport(data, params.type, params.category);
                return res.status(HttpStatus.OK).json({ data });
            } else {
                throw new Error("NO API KEY");
            }
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "建立數據中心資料失敗",
                    error: {
                        error: "n11002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
