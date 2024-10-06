import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Transaction } from "sequelize";
import moment from "moment";
import { User } from "src/users/user.entity";
import { GoogleUser } from "src/users/google/google-user.entity";
import { GoogleOauthService } from "./google-oauth.service";
import { IGoogleUserInfo } from "./google-user.interface";
// 在 google 登入｜註冊｜綁定流程時 需要判斷 此兩種裝置走額外機制
const googleAuthDeviceCheck = ["web", "android"];
@Injectable()
export class GoogleUserRepository {
    constructor(
        @Inject("GOOGLE_USERS_REPOSITORY")
        private googleUsersRepository: typeof GoogleUser,
        private googleOauthService: GoogleOauthService,
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
    async findOne(data: { column: string; value: string | number }): Promise<GoogleUser> {
        const query = {};
        query[data.column] = data.value;
        const user = await this.googleUsersRepository.findOne<GoogleUser>({ where: query, include: [User] });
        return user;
    }
    /**
     * 新增或更新
     */
    async createOrUpdate(data: { access_token: string; userId: string; device?: string }, transaction: Transaction) {
        let oauthInfo: IGoogleUserInfo = {};
        // 判斷是 web 時 要執行別種驗證方式
        if (googleAuthDeviceCheck.includes(data.device)) {
            // 驗證 google 登入 並回傳使用者資料
            oauthInfo = await this.googleOauthService.authenticateByWeb({ accessToken: data.access_token });
        } else {
            // 驗證 google 登入 並回傳使用者資料
            oauthInfo = await this.googleOauthService.getUserInfo({ accessToken: data.access_token });
        }
        // 取得 google users 表資料
        let user = await this.findOne({ column: "email", value: oauthInfo.email });
        // 判斷是否有綁定過
        if (user !== null && user.user_id !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 Google 帳號已綁定",
                    error: {
                        error: 1016,
                        msg: "此 Google 帳號已綁定",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 判斷有創建過使用者資料使用更新方法
        if (user !== null && user.user_id === null) {
            const user = await this.update({ ...oauthInfo }, data.userId, transaction);
            return user;
        }
        const saveData = {
            // 因為 web 與 android 端使用機制 api 不會回傳 id 因此加上判斷 web 與 android 端 拿 sub 值
            account_id: googleAuthDeviceCheck.includes(data.device) ? oauthInfo.sub : oauthInfo.id,
            user_id: data.userId,
            email: oauthInfo.email,
            family_name: oauthInfo.family_name,
            given_name: oauthInfo.given_name,
            locale: oauthInfo.locale,
            name: oauthInfo.name,
            picture: oauthInfo.picture,
            last_login_at: moment().valueOf(),
        };
        try {
            user = await this.googleUsersRepository.create<GoogleUser>(saveData, { transaction });
            return user;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊 Google user 失敗",
                    error: {
                        error: "n7002",
                        msg: "註冊 Google user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 更新
     */
    async update(data: IGoogleUserInfo, userId: string | number, transaction?: Transaction): Promise<GoogleUser> {
        try {
            await this.googleUsersRepository.update<GoogleUser>(
                {
                    account_id: data.id,
                    user_id: userId,
                    email: data.email,
                    family_name: data.family_name,
                    given_name: data.given_name,
                    locale: data.locale,
                    picture: data.picture,
                    last_login_at: moment().valueOf(),
                },
                {
                    where: { email: data.email },
                    transaction: transaction,
                },
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
                    msg: "更新 Google user 失敗",
                    error: {
                        error: "n7010",
                        msg: "更新 Google user 失敗",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
    /**
     * 更新 user_id 為 null
     * @param { type String or Number(字串或數字) } userId 使用者 id
     */
    async updateUserIdToNull(userId: string | number): Promise<any> {
        try {
            await this.googleUsersRepository.update(
                {
                    user_id: null,
                },
                { where: { user_id: userId } },
            );
            return { success: true };
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "解除 Google User 綁定失敗",
                    error: {
                        error: "n7016",
                        msg: "解除 Google User 綁定失敗",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
