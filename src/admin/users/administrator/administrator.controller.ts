import { Controller, Get, Param, Res, HttpStatus, HttpException, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { AdministratorService } from "./administrator.service";

@Controller("backyard/administrator")
export class AdministratorController {
    constructor(private readonly administratorService: AdministratorService) {}

    @UseGuards(AdminAuthGuard)
    @Get("/:column/:value")
    async getOneUser(@Param() params, @Res() res) {
        try {
            const user: any = await this.administratorService.findOneById(params.value);
            return res.status(HttpStatus.OK).json(user);
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "找不到管理者",
                    error: {
                        error: "找不到管理者",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
