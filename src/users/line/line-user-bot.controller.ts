import { Controller, Post, Patch, Get, Req, Res, Body, HttpStatus, UseGuards, HttpException, UseInterceptors, Param, Query, Headers } from "@nestjs/common";
import { Transaction } from "sequelize";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";
import { TransactionParam } from "src/database/database-transaction.decorator";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { LineUserRepository } from "./line-user.repository";
import { LineUserDto, LineUserUpdateDto } from "./dto/line-userDto.dto";
import moment from "moment";
import { CreateUserDto } from "../dto/createUserDto.dto";
import { UsersRepository } from "../users.repository";
import { User } from "../user.entity";
import { UsersService } from "../users.service";
@Controller("line-user-bot")
export class LineUserBotController {
    constructor(private readonly lineUserRepository: LineUserRepository, private readonly usersRepository: UsersRepository, private readonly usersService: UsersService) {}

    /**
     * 新增 line-users 表資料
     * @param body
     * @param transaction
     * @param res
     * @returns
     */
    @UseInterceptors(TransactionInterceptor)
    @UseGuards(JwtAuthPHPServerGuard)
    @Post("create-line-user")
    async createLineUser(@Body() body: LineUserDto, @TransactionParam() transaction: Transaction, @Res() res) {
        const data: any = body;
        data.last_login_at = moment().format("YYYY-MM-DD HH:mm:ss");
        data.status = 0;
        // 新增 Line user
        const result = await this.lineUserRepository.onlyCreate(data, transaction);
        return res.status(HttpStatus.OK).json(result);
    }

    /**
     * 使用 midori_id 查找 line-users 表資料並更新
     * @param body
     * @param transaction
     */
    @UseInterceptors(TransactionInterceptor)
    @UseGuards(JwtAuthPHPServerGuard)
    @Patch("/update-line-user/:midori_id")
    async updateByMidoriId(@Body() body: LineUserUpdateDto, @TransactionParam() transaction: Transaction, @Res() res, @Param() param: { midori_id: string }) {
        body.midori_id = param.midori_id;
        // 更新 Line user
        await this.lineUserRepository.findByMidoriIdAndUpdate(body, transaction);
        // 等待交易事件做完後再觸發
        transaction.afterCommit(async () => {
            const result = await this.lineUserRepository.findOne({ column: "midori_id", value: body.midori_id });
            return res.status(HttpStatus.OK).json(result);
        });
    }

    /**
     * 使用 midori-id 取得 line-users 表使用者資料
     * @param midori_id
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Get("/line-user/:midori_id")
    async getDataByMidoriId(@Param() param: { midori_id: string }, @Res() res) {
        const user = await this.lineUserRepository.findOne({ column: "midori_id", value: param["midori_id"] });
        if (user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "尋找 LINE user 失敗",
                    error: {
                        error: "n7019",
                        msg: "尋找 LINE user 失敗",
                    },
                },
                HttpStatus.NOT_FOUND,
            );
        }
        return res.status(HttpStatus.OK).json(user);
    }

    /**
     * 新增 users
     * @param body
     * @param transaction
     */
    @UseInterceptors(TransactionInterceptor)
    @UseGuards(JwtAuthPHPServerGuard)
    @Post("create-user")
    async createUsers(@Body() body: CreateUserDto, @TransactionParam() transaction: Transaction, @Res() res, @Headers() headers) {
        try {
            const user = await this.usersRepository.create(body, headers, transaction);
            return res.status(HttpStatus.OK).json(user);
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "LINE Chat Bot 新增 user 失敗",
                    error: {
                        error: "n3007",
                        msg: "新增 user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 查詢單一 users
     * @param body
     * @param transaction
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Get("/users/query")
    async findUsers(@Query() query: any, @Res() res) {
        const user = await this.usersRepository.findOneByMoreQuery({ query });
        if (user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "LINE Chat Bot 查無使用者資料",
                    error: {
                        error: "n3006",
                        msg: "查無使用者資料",
                    },
                },
                HttpStatus.NOT_FOUND,
            );
        }
        return res.status(HttpStatus.OK).json(user);
    }
    /**
     * 查詢多筆服務商資料
     * @param body
     * @param transaction
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Get("/providers/query")
    async findProviders(@Query() query: any, @Res() res) {
        const users = await this.usersService.getProviders({ query, limit: query.limit, page: query.page });
        if (users.total === 0) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "LINE Chat Bot 查無服務商列表",
                    error: {
                        error: "n3022",
                        msg: "查無服務商列表",
                    },
                },
                HttpStatus.NOT_FOUND,
            );
        }
        return res.status(HttpStatus.OK).json(users);
    }
}
