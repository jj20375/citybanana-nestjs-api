import { Controller, Param, Query, Get, Put, Body, Res, Req, HttpException, HttpStatus, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { AuthenticationRepository } from "./authentication.repostiory";
import { AuthenticationUpdateDto } from "./dto/authendicationUpdateDto.dto";

@Controller("authentication")
export class AuthenticationController {
    constructor(private readonly authenticationRepository: AuthenticationRepository) {}

    @UseGuards(AdminAuthGuard)
    @Get("/apply-to-providers")
    async findAll(@Query() query, @Res() res) {
        try {
            const filterOptions = query;
            const datas = await this.authenticationRepository.findAll({ filterOptions, page: query.page, limit: query.limit });
            return res.status(HttpStatus.OK).json(datas);
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得身份驗證列表失敗",
                    error: {
                        error: "n10001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @UseGuards(AdminAuthGuard)
    @Get("/apply-to-provider/:id")
    async findOne(@Param() params, @Res() res) {
        try {
            const data = await this.authenticationRepository.findOne({ column: "id", value: params.id });
            return res.status(HttpStatus.OK).json(data);
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得身份驗證資料失敗",
                    error: {
                        error: "n10002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @UseGuards(AdminAuthGuard)
    @Put("/update-apply-to-provider/:id")
    async update(@Param() params, @Body() body: AuthenticationUpdateDto, @Res() res) {
        try {
            const data = await this.authenticationRepository.update(body);
            return res.status(HttpStatus.OK).json(data);
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新身份驗證資料失敗",
                    error: {
                        error: "n10003",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
