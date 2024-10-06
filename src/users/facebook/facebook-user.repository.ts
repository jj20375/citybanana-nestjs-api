import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import moment from "moment";
import { User } from "src/users/user.entity";
import { FacebookUser } from "src/users/facebook/facebook-user.entity";
import { IFacebookUserInfo } from "src/users/facebook/facebook-user.interface";
@Injectable()
export class FacebookUserRepository {
    constructor(
        @Inject("Facebook_USERS_REPOSITORY")
        private facebookUsersRepository: typeof FacebookUser
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
    async findOne(data: { column: string; value: string | number }): Promise<FacebookUser> {
        const query = {};
        query[data.column] = data.value;
        const user = await this.facebookUsersRepository.findOne<FacebookUser>({ where: query, include: [User] });
        return user;
    }
    /**
     * 新增或更新
     */
    async createOrUpdate(data: { userId: string; asid: string; oauthInfo: IFacebookUserInfo }, transaction: Transaction) {
        // 取得 facebook users 表資料
        let user = await this.findOne({ column: "asid", value: data.asid });
        // 判斷是否有綁定過
        if (user !== null && user.user_id !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 Facebook 帳號已綁定",
                    error: {
                        error: 1016,
                        msg: "此 Facebook 帳號已綁定",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 判斷有創建過使用者資料使用更新方法
        if (user !== null && user.user_id === null) {
            const user = await this.update({ ...data.oauthInfo }, data.userId, transaction);
            return user;
        }
        const saveData = {
            asid: data.oauthInfo.id,
            user_id: data.userId,
            email: data.oauthInfo.email ?? null,
            first_name: data.oauthInfo.first_name,
            last_name: data.oauthInfo.last_name,
            name: data.oauthInfo.first_name + data.oauthInfo.last_name,
            picture: data.oauthInfo.picture.data.url,
            last_login_at: moment().valueOf(),
        };
        try {
            user = await this.facebookUsersRepository.create<FacebookUser>(saveData, { transaction });
            return user;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊 Facebook user 失敗",
                    error: {
                        error: "n7012",
                        msg: "註冊 Facebook user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 更新
     */
    async update(data: IFacebookUserInfo, userId: string | number, transaction?: Transaction): Promise<FacebookUser> {
        try {
            await this.facebookUsersRepository.update(
                {
                    asid: data.id,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    name: data.first_name + data.last_name,
                    picture: data.picture.data.url,
                    user_id: userId,
                    last_login_at: moment().valueOf(),
                },
                { where: { asid: data.id }, transaction: transaction }
            );
            const user = await this.findOne({ column: "user_id", value: userId });
            return user;
        } catch (err) {
            console.log(err);
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新 Facebook user 失敗",
                    error: {
                        error: "n7011",
                        msg: "更新 Facebook user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 更新 user_id 為 null
     * @param { type String or Number(字串或數字) } userId 使用者 id
     */
    async updateUserIdToNull(userId: string | number): Promise<any> {
        try {
            await this.facebookUsersRepository.update(
                {
                    user_id: null,
                },
                { where: { user_id: userId } }
            );
            return { success: true };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "解除 Facebook User 綁定失敗",
                    error: {
                        error: "n7015",
                        msg: "解除 Facebook User 綁定失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
