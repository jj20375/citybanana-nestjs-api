import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import moment from "moment";
import { Op, Transaction, fn, where, col } from "sequelize";
import { Vouchers } from "./vouchers.entity";

@Injectable()
export class VouchersRepository {
    constructor(
        @Inject("VOUCHERS_PROVIDERS")
        private vouchersRepository: typeof Vouchers
    ) {}

    /**
     * 尋找單一資料
     * @param data
     * @example {
     *    column: id (欄位名稱) { type String (字串) } ,
     *    value: 1 (查詢值) { type String or Number (字串或數字)},
     * }
     * @returns
     */
    async findOne(data: { column: string; value: string | number }): Promise<Vouchers> {
        const query = {};
        query[data.column] = data.value;
        try {
            const voucher = await this.vouchersRepository.findOne<Vouchers>({ where: query });
            return voucher;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "未找到折抵金資料",
                    error: {
                        error: "n17001",
                        msg: err,
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
    }

    /**
     * 取得未使用折抵金 且未過期的
     *  orm 文件
     * https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
     *
     */
    async findUnExpiredAndEffective(data: { userId: number }): Promise<Vouchers[]> {
        try {
            const datas = await this.vouchersRepository.findAll<Vouchers>({
                raw: true,
                where: {
                    user_id: data.userId,
                    expired_at: {
                        // gte 等同 >=
                        [Op.gte]: new Date(),
                    },
                    status: 0,
                    // 判斷 amount 值 是否大於 used 如果有的話 代表這折抵金還沒被使用光
                    // where 條件 參考文獻 https://github.com/sequelize/sequelize/issues/3893
                    amount: where(col("amount"), ">", col("used")),
                },
                order: [["expired_at", "ASC"]],
            });
            return datas;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "未找到折抵金資料",
                    error: {
                        error: "n17001",
                        msg: err,
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
    }
    /**
     * 更新
     * @param data
     * @returns
     */
    async updateAmountAdnUsedColumn(data: { id: number; amount: number; used: number }, transaction: Transaction): Promise<Vouchers> {
        try {
            await this.vouchersRepository.update(
                {
                    amount: data.amount,
                    used: data.used,
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                },
                {
                    where: { id: data.id },
                    transaction: transaction,
                }
            );
            const voucher = await this.findOne({ column: "id", value: data.id });
            return voucher;
        } catch (err) {
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新折抵金資料失敗",
                    error: {
                        error: "n17002",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
