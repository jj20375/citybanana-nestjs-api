import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { Category } from "./categories.entity";

@Injectable()
export class CategoryRepository {
    constructor(
        @Inject("CATEGORY_REPOSITORY")
        private categoryRepository: typeof Category
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
    async findOne(data: { column: string; value: any }): Promise<Category> {
        const query = {};
        query[data.column] = data.value;
        const category = await this.categoryRepository.findOne<Category>({
            where: query,
        });
        return category;
    }
}
