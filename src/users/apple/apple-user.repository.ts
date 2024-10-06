import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import moment from "moment";
import { User } from "src/users/user.entity";
import { AppleUser } from "src/users/apple/apple-user.entity";
import { AppleOauthService } from "./apple-oauth.service";
import { IAppleUserInfo } from "./apple-user.interface";
@Injectable()
export class AppleUserRepository {
    constructor(
        @Inject("APPLE_USERS_REPOSITORY")
        private appleUsersRepository: typeof AppleUser,
        private appleOauthService: AppleOauthService
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
    async findOne(data: { column: string; value: string | number }): Promise<AppleUser> {
        const query = {};
        query[data.column] = data.value;
        const user = await this.appleUsersRepository.findOne<AppleUser>({ where: query, include: [User] });
        return user;
    }
    /**
     * 新增
     */
    async createOrUpdate(data: { id_token: string; userId: string }, transaction: Transaction) {
        // 取得 apple oauth 使用者資料
        const oauthInfo = await this.appleOauthService.authenticate({ identifyToken: data.id_token });
        // 取得 apple users 表資料
        const user = await this.findOne({ column: "unique_id", value: oauthInfo.unique_id });
        // 判斷是否有綁定過
        if (user !== null && user.user_id !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此Appple帳號已綁定",
                    error: {
                        error: 1016,
                        msg: "此Appple帳號已綁定",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 判斷有創建過使用者資料使用更新方法
        if (user !== null && user.user_id === null) {
            const user = await this.update({ ...oauthInfo }, data.userId, transaction);
            return user;
        }
        const saveData = {
            unique_id: oauthInfo.unique_id,
            user_id: data.userId,
            email: oauthInfo.email,
            last_login_at: moment().valueOf(),
        };
        try {
            const user = await this.appleUsersRepository.create<AppleUser>(saveData, { transaction });
            return user;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊 Apple user 失敗",
                    error: {
                        error: "n7007",
                        msg: "註冊 Apple user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 更新
     */
    async update(data: IAppleUserInfo, userId: string | number, transaction?: Transaction): Promise<AppleUser> {
        console.log(data, userId, "data.unique_id");
        try {
            await this.appleUsersRepository.update(
                {
                    // unique_id: data.unique_id,
                    email: data.email,
                    user_id: userId,
                    last_login_at: moment().valueOf(),
                },
                { where: { unique_id: data.unique_id }, transaction: transaction }
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
                    msg: "更新 Apple user 失敗",
                    error: {
                        error: "n7009",
                        msg: "更新 Apple user 失敗",
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
            await this.appleUsersRepository.update(
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
                    msg: "解除 Apple User 綁定失敗",
                    error: {
                        error: "n7013",
                        msg: "解除 Apple User 綁定失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
