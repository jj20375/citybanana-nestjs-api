import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Op, Transaction } from "sequelize";
import { Order } from "./order.entity";
import { IorderCreate } from "./order.interface";
import { OrderHelperService } from "./order-helper/order-helper.service";
import { ConfigService } from "@nestjs/config";
import { User } from "src/users/user.entity";
import moment from "moment";
@Injectable()
export class OrderRepository {
    constructor(
        @Inject("ORDER_REPOSITORY")
        private orderRepository: typeof Order,
        private configService: ConfigService,
    ) {}

    // 找尋會員是否有跟服務商有預訂單紀錄
    async isEmptyOrderRecord(data: { memberId: string | number; providerId: string | number }) {
        const order = await this.orderRepository.findOne({
            where: {
                [Op.and]: [{ user_id: data.memberId }, { provider_id: data.providerId }],
            },
        });
        if (order !== null) {
            return false;
        }
        return true;
    }

    /**
     * 新增訂單
     */
    async create(data: IorderCreate, transaction: Transaction): Promise<Order> {
        const saveData = {
            ...data,
        };

        try {
            const order = await this.orderRepository.create<Order>({ ...saveData }, { transaction });
            if (order === null) {
                return order;
            }
            return await order.toJSON();
        } catch (err) {
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "創建訂單失敗",
                    error: {
                        error: "n8005",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * 取得訂單
     */
    async getData(data: { orderId: string }) {
        const order = await this.orderRepository.findOne({
            where: {
                order_id: data.orderId,
            },
            include: [{ model: User, as: "user" }],
        });
        return order;
    }
}
