import { Controller, Get, Post, Put, Res, Body, HttpStatus, HttpException, UseInterceptors, Param, UseGuards, Req, Query } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { RegisterUserDto } from "./dto/registerUserDto.dto";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { Transaction } from "sequelize";
import { TransactionParam } from "src/database/database-transaction.decorator";
import { UsersService } from "./users.service";
import { ProviderService } from "./provider/provider.service";
import * as fs from "fs";
import * as path from "path";
import glob from "glob";
import { UsersHelperService } from "./users-helper.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { CreateUserDto } from "./dto/createUserDto.dto";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";

@Controller("users")
export class UsersController {
    constructor(
        private usersRepository: UsersRepository,
        private usersService: UsersService,
        private usersHelperService: UsersHelperService,
        private providerService: ProviderService
    ) {}

    @Get("redis")
    async getRedis() {
        try {
            // const keys = this.usersService.getRedisClient().select(1, (err, res) => {
            //     console.log(res);
            //     return this.usersService.getRedisClient().keys((err, keys) => {
            //         console.log(keys);
            //         return Promise.resolve(keys);
            //     });
            // });
            const keys = await this.usersService.verifyRegisterCrumb({ phone: "8886955831666", crumb: "test" });
            return await keys;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "redis error",
                    error: {
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得可參與活動列表
     * @param res
     * @returns
     */
    @Get("activities")
    async getActivities(@Res() res) {
        const data = await this.providerService.getActivities();
        return res.status(HttpStatus.OK).json(data);
    }

    /**
     * 取得會員瀏覽紀錄
     * @param req
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @Get("member/history")
    async getMemberHistory(@Req() req, @Res() res) {
        try {
            const data = await this.usersService.getMemberHistory(req);
            return res.status(HttpStatus.OK).json({ data });
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得會員瀏覽紀錄失敗",
                    error: {
                        error: "n3020",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * CMS 更新服務商可參與活動
     * @param req
     * @param res
     * @param transaction
     * @returns
     */
    @UseGuards(AdminAuthGuard)
    @UseInterceptors(TransactionInterceptor)
    @Put(":userID/cms/activities")
    async putCMSActivities(@Req() req, @Res() res, @TransactionParam() transaction: Transaction) {
        try {
            await this.providerService.updateActivitiesByUser(req.params.userID, req.body.activities, transaction);
            return res.status(HttpStatus.OK).json({ success: "ok" });
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新服務商可參與活動資料失敗",
                    error: {
                        error: "n3015",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 更新服務商可參與活動
     * @param req
     * @param res
     * @param transaction
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(TransactionInterceptor)
    @Put("activities")
    async putActivities(@Req() req, @Res() res, @TransactionParam() transaction: Transaction) {
        try {
            await this.providerService.updateActivitiesByUser(req.user.sub, req.body.activities, transaction);
            return res.status(HttpStatus.OK).json({ success: "ok" });
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新服務商參與活動失敗",
                    error: {
                        error: "n3015",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
