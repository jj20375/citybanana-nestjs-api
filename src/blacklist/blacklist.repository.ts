import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { User } from "src/users/user.entity";
import { Blacklist } from "./blacklist.entity";

@Injectable()
export class BlacklistRepository {
    constructor(
        @Inject("BLACKLIST_REPOSITORY")
        private blacklistRepository: typeof Blacklist
    ) {}

    /**
     * 單一條件尋找單一資料
     * @param data
     * @example {
     *    column: id (欄位名稱) { type String (字串) } ,
     *    value: 1 (查詢值) { type Any (任何型別)},
     * }
     * @returns
     */
    async findOne(data: { column: string; value: any }): Promise<Blacklist> {
        const query = {};
        query[data.column] = data.value;
        const blacklist = await this.blacklistRepository.findOne<Blacklist>({
            where: query,
            include: [{ model: User, as: "user" }],
        });
        return blacklist;
    }
}
