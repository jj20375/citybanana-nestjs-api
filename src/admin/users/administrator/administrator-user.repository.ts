import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { AdministratorUser } from "src/admin/users/administrator/administrator-user.entity";
@Injectable()
export class AdministratorUserRepository {
    constructor(
        @Inject("ADMINISTRATOR_USERS_REPOSITORY")
        private adminRepository: typeof AdministratorUser
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
    async findOne(data: { column: string; value: string | number }): Promise<AdministratorUser> {
        const query = {};
        query[data.column] = data.value;
        const user = await this.adminRepository.findOne<AdministratorUser>({ where: query, attributes: { exclude: ["password"] } });
        return user;
    }
}
