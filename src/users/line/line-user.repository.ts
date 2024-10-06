import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import moment from "moment";
import { User } from "src/users/user.entity";
import { LineUser } from "src/users/line/line-user.entity";
import { LineOauthService } from "./line-oauth.service";
// Line 官方 api 回傳使用者資料 type
import { ILineOauthInfo } from "./line-oauth.interface";
// line-users 表 資料 type
import { ILineUser } from "./line-user.interface";
@Injectable()
export class LineUserRepository {
    constructor(
        @Inject("LINE_USERS_REPOSITORY")
        private lineUsersRepository: typeof LineUser,
        private lineOauthService: LineOauthService
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
    async findOne(data: { column: string; value: string | number }): Promise<LineUser> {
        const query = {};
        query[data.column] = data.value;
        const user = await this.lineUsersRepository.findOne<LineUser>({ where: query, include: [User] });
        return user;
    }
    /**
     * 新增或更新
     */
    async createOrUpdate(data: { access_token?: string; userId?: string }, transaction: Transaction) {
        // 取得 line oauth 使用者資料
        const oauthInfo = await this.lineOauthService.authenticate({ accessToken: data.access_token });
        // 檢查是否加官方帳號為好友
        const friendshipStatus = await this.lineOauthService.getFriendshipStatus({ accessToken: data.access_token });
        if (friendshipStatus.friendFlag == false) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.PRECONDITION_FAILED,
                    msg: "尚未加 LINE 官方帳號為好友",
                    error: {
                        error: "n7018",
                        msg: "尚未加 LINE 官方帳號為好友",
                    },
                },
                HttpStatus.PRECONDITION_FAILED
            );
        }
        // 取得 line users 表資料
        let user = await this.findOne({ column: "midori_id", value: oauthInfo.userId });
        // 判斷是否有綁定過
        if (user !== null && user.user_id !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 LINE 帳號已綁定",
                    error: {
                        error: 1016,
                        msg: "此 LINE 帳號已綁定",
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
            midori_id: oauthInfo.userId,
            user_id: data.userId,
            name: oauthInfo.displayName,
            picture: oauthInfo.pictureUrl,
            last_login_at: moment().valueOf(),
        };
        try {
            user = await this.lineUsersRepository.create<LineUser>(saveData, { transaction });
            return user;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊 LINE user 失敗",
                    error: {
                        error: "n7004",
                        msg: "註冊 LINE user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 更新
     */
    async update(data: ILineOauthInfo, userId: string | number, transaction?: Transaction): Promise<LineUser> {
        try {
            await this.lineUsersRepository.update(
                {
                    midori_id: data.userId,
                    name: data.displayName,
                    picture: data.pictureUrl,
                    user_id: userId,
                    last_login_at: moment().valueOf(),
                },
                { where: { midori_id: data.userId }, transaction: transaction }
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
                    msg: "更新 LINE user 失敗",
                    error: {
                        error: "n7008",
                        msg: "更新 LINE user 失敗",
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
            await this.lineUsersRepository.update(
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
                    msg: "解除 LINE User 綁定失敗",
                    error: {
                        error: "n7014",
                        msg: "解除 LINE User 綁定失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 單純新增 lineUser 方法
     */
    async onlyCreate(data: ILineUser, transaction: Transaction): Promise<LineUser> {
        const saveData: any = data;
        try {
            const user = await this.lineUsersRepository.create<LineUser>(saveData, { transaction });
            return user;
        } catch (err) {
            console.log(err);
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊 LINE user 失敗",
                    error: {
                        error: "n7004",
                        msg: "註冊 LINE user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
    /**
     * 使用 midori_id 找尋 lineUser 方法 並更新
     */
    async findByMidoriIdAndUpdate(data: ILineUser, transaction: Transaction): Promise<void> {
        const user = await this.findOne({ column: "midori_id", value: data.midori_id });
        if (user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "尋找 LINE user 失敗",
                    error: {
                        error: "n7019",
                        msg: "尋找 LINE user 失敗",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        try {
            await this.lineUsersRepository.update(
                {
                    midori_id: data.midori_id,
                    name: data.name ?? user.name,
                    picture: data.picture ?? user.picture,
                    user_id: data.user_id,
                    last_login_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                },
                { where: { midori_id: data.midori_id }, transaction: transaction }
            );
            return;
        } catch (err) {
            console.log(err);
            if (transaction) {
                transaction.rollback();
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新 LINE user 失敗",
                    error: {
                        error: "n7008",
                        msg: "更新 LINE user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
