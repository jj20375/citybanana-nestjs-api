import { Injectable, Inject } from "@nestjs/common";
import { Op } from "sequelize";
import { Promoters } from "./promoters.entity";
import { User } from "src/users/user.entity";

@Injectable()
export class PromotersRepository {
    constructor(
        @Inject("PROMOTERS_REPOSITORY")
        private readonly promotersRepository: typeof Promoters
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
    async findOne(data: { column: string; value: string | number }): Promise<Promoters> {
        const query = {};
        query[data.column] = data.value;
        const promoter = await this.promotersRepository.findOne<Promoters>({ where: query, include: [User] });
        if (promoter === null) {
            return promoter;
        }
        return await promoter.toJSON();
    }
}
