import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { CategoryUser } from "./category-user.entity";

@Injectable()
export class CategoryUserRepository {
    constructor(
        @Inject("CATEGORY_USER_REPOSITORY")
        private categoryUserRepository: typeof CategoryUser
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
    async findOne(data: { column: string; value: any }): Promise<CategoryUser> {
        const query = {};
        query[data.column] = data.value;
        const categoryUser = await this.categoryUserRepository.findOne<CategoryUser>({
            where: query,
        });
        return categoryUser;
    }
}
