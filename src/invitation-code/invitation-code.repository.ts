import { Injectable, Inject } from "@nestjs/common";
import { Op } from "sequelize";
import { InvitationCode } from "./invitation-code.entity";
import { User } from "src/users/user.entity";
@Injectable()
export class InvitationCodeRepository {
    constructor(
        @Inject("INVITATION_CODE_REPOSITORY")
        private readonly invitationCodeRepository: typeof InvitationCode
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
    async findOne(data: { column: string; value: string | number }): Promise<InvitationCode> {
        const query = {};
        query[data.column] = data.value;
        const invitationCode = await this.invitationCodeRepository.findOne<InvitationCode>({ where: query, include: [User] });
        if (invitationCode === null) {
            return invitationCode;
        }
        return await invitationCode.toJSON();
    }
}
