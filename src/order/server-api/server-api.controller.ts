import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Req,
    Res,
    UseGuards,
    HttpStatus,
    HttpException,
    Delete,
    UseInterceptors,
    Query,
    Ip,
} from "@nestjs/common";
import { JwtAuthPHPServerGuard } from "src/auth/jwt-php-server.guard";
import { TransactionParam } from "src/database/database-transaction.decorator";
import { Transaction } from "sequelize";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { OrderService } from "../order.service";
import { CreateOrderDto } from "../dto/orderDto.dto";
import { UsersRepository } from "src/users/users.repository";

@Controller("order-server")
export class OrderServerApiController {
    constructor(private readonly orderService: OrderService, private readonly usersRepository: UsersRepository) {}
    /**
     * Server 端驗證簡訊驗證碼
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @UseInterceptors(TransactionInterceptor)
    @Post("create")
    async createOrder(@Body() body: CreateOrderDto, @Res() res, @Req() req, @TransactionParam() transaction: Transaction, @Ip() ip) {
        // body.memberData = req.userData;
        const memberData = await this.usersRepository.findOne({ column: "id", value: body.user_id });
        const saveData = {
            ...body,
            ip: ip,
            memberData,
        };
        const data = await this.orderService.create(saveData, transaction);
        return res.status(HttpStatus.OK).json(data);
    }

    /**
     * Server 端驗證簡訊驗證碼
     * @param body
     * @param res
     * @returns
     */
    @UseGuards(JwtAuthPHPServerGuard)
    @Get("/:providerId/categories/:categoryId/available-times/:memberId")
    async getAvailableTimes(@Param() params, @Res() res) {
        const data = await this.orderService.availableTimes({
            category_id: parseInt(params.categoryId),
            provider_id: params.providerId,
            member_id: params.memberId,
        });
        return res.status(HttpStatus.OK).json(data);
    }
}
