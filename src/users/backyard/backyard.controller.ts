import { Controller, Get, Post, Put, Res, Body, HttpStatus, HttpException, UseInterceptors, Param, UseGuards, Req, Query } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { UsersRepository } from "../users.repository";

@Controller("backyard/users")
export class BackyardController {
    constructor(private usersRepository: UsersRepository) {}
    @UseGuards(AdminAuthGuard)
    @Get()
    /**
     * 尋找所有 user 並且有分頁機制
     */
    async findAll(@Query() query, @Res() res) {
        console.log(query, "query");
        try {
            const filterOptions = query;
            const datas = await this.usersRepository.findAll({ filterOptions, page: query.page, limit: query.limit });
            return res.status(HttpStatus.OK).json(datas);
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得使用者列表資料失敗",
                    error: {
                        error: "n3021",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
