import { Injectable, Inject, forwardRef, HttpException, HttpStatus, Headers } from "@nestjs/common";
import { User } from "./user.entity";
import { Op, Transaction, fn, where, col } from "sequelize";
import { ChatsService } from "src/firebase/chats/chats.service";
import { NotificationService } from "src/notification/notification.service";
import { UsersHelperService } from "./users-helper.service";
import { AuthService } from "src/auth/auth.service";
import moment from "moment";
import { UserDevice } from "./user-device.entity";
import { Blacklist } from "src/blacklist/blacklist.entity";
import { Activity } from "../activity/activities.entity";
import { Badge } from "src/badges/badge.entity";
import { UserFeedback } from "./userFeedback/userFeedback.entity";
import { LineUser } from "./line/line-user.entity";
import { FacebookUser } from "./facebook/facebook-user.entity";
import { GoogleUser } from "./google/google-user.entity";
import { AppleUser } from "./apple/apple-user.entity";
import { RegisterProducer } from "./register-queuue/register.producer";
import { CategoryUser } from "src/categories/category-user/category-user.entity";
import { Category } from "src/categories/categories.entity";
import { NonBusinessHours } from "src/business/non-business-hours/non-business-hours.entity";
import { WeeklyBusinessHours } from "src/business/weekly-business-hours/weekly-business-hours.entity";
import { Order } from "src/order/order.entity";
import { DatingDemandEnrollers } from "src/demands/dating-demands-enrollers/dating-demands-enrollers.entity";
import { DatingDemands } from "src/demands/dating-demands/dating-demands.entity";
import { OrderStatusConfig } from "src/order/enums/order.enum";
import { DatingDemandStatus } from "src/demands/dating-demands/enums/dating-demands.enum";
import { DatingDemandEnrollersStatus } from "src/demands/dating-demands-enrollers/enums/dating-demands-enrollers.enum";
import { isEmpty } from "src/service/utils.service";
import { InvitationCodeService } from "src/invitation-code/invitation-code.service";
import { LoggerService } from "src/logger/logger.service";
import { UsersService } from "./users.service";
@Injectable()
export class UsersRepository {
    constructor(
        @Inject("USERS_REPOSITORY")
        private usersRepository: typeof User,
        @Inject(forwardRef(() => ChatsService))
        private readonly chatsService: ChatsService,
        private readonly usersService: UsersService,
        private readonly usersHelper: UsersHelperService,
        private readonly notificationService: NotificationService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        private readonly registerProducer: RegisterProducer,
        private readonly invitationCodeService: InvitationCodeService,
        private readonly loggerService: LoggerService,
    ) {}

    async verifyPhoneAndPassword(phone: string, password: string): Promise<any> {
        const user = await this.usersRepository.findOne<User>({ where: { phone } });
        if (user === null) {
            return false;
        }
        const isMatch = this.usersHelper.verifyPassword(password, user.password);
        if (!isMatch) {
            return false;
        }
        return user;
    }

    /**
     * 單一條件尋找單一資料
     * @param data
     * @example {
     *    column: id (欄位名稱) { type String (字串) } ,
     *    value: 1 (查詢值) { type Any (任何型別)},
     * }
     * @returns
     */
    async findOne(data: { column: string; value: any }, needPassword = false): Promise<User> {
        const query = {};
        query[data.column] = data.value;
        let user: any = await this.usersRepository.findOne<User>({
            where: query,
            include: [
                UserDevice,
                GoogleUser,
                FacebookUser,
                LineUser,
                AppleUser,
                {
                    model: Activity,
                    attributes: ["id", "name"],
                    through: {
                        as: "pivot",
                        attributes: ["user_id", "activity_id"],
                    },
                },
                {
                    model: Badge,
                    attributes: ["id", "name"],
                    through: {
                        as: "pivot",
                        attributes: ["user_id", "badge_id"],
                    },
                },
            ],
        });
        if (user === null) {
            return user;
        }
        user = await user.toJSON();
        /**
         * 圖片縮圖
         */
        const userThumbnails = await this.usersHelper.userThumbnails({
            bananaId: user.banana_id,
            gender: user.gender,
            photos: user.media.photos ?? [],
            videos: user.media.videos ?? [],
        });
        if (!needPassword) {
            // 刪除密碼欄位
            delete user.password;
        }
        // 取得可參與活動 activity_id
        const activitiesIds = user.activities.map((activity) => activity.pivot.activity_id);
        // 回傳所有可參與活動 並加上 enabled 參數值 1 代表以設定 0 代表為設定
        const enabledActivities = await this.usersHelper.getEnableActivities({
            enableActivitiesIds: activitiesIds,
            customActivities: user.custom_activities,
        });
        user = { ...user, ...userThumbnails, ...enabledActivities };
        return user;
    }

    /**
     * 多重條件尋找單一資料
     * @param data.query 搜尋條件
     * @example {
     *    query: {
     *    id: 1,
     *    status: 1
     *  }
     * }
     * @returns
     */
    async findOneByMoreQuery(data: { query: any }): Promise<User> {
        const query2 = {};
        Object.keys(data.query).forEach((objKey) => {
            query2[objKey] = data.query[objKey];
        });
        // 判斷搜尋名稱時 使用 like 條件
        if (data.query.hasOwnProperty("name")) {
            query2["name"] = { [Op.substring]: data.query.name };
        }
        const user: any = await this.usersRepository.findOne<User>({
            where: query2,
            include: [
                UserDevice,
                { model: Blacklist, as: "blacklist_userIds" },
                { model: Blacklist, as: "blacklist_blackIds" },
                CategoryUser,
                {
                    model: Activity,
                    attributes: ["id", "name"],
                    through: {
                        as: "pivot",
                        attributes: ["user_id", "activity_id"],
                    },
                },
            ],
        });
        if (user === null) {
            return null;
        }
        /**
         * 圖片縮圖
         */
        const userThumbnails = await this.usersHelper.userThumbnails({
            bananaId: user.banana_id,
            gender: user.gender,
            photos: user.media.photos ?? [],
            videos: user.media.videos ?? [],
        });
        return user;
    }
    /**
     * 多重條件尋找單一資料
     * orm 文件
     * https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
     * @param data.query 搜尋條件
     * @example {
     *    query: {
     *    id: 1,
     *    status: 1
     *  }
     * }
     * @returns
     */
    async findOneByProviderMoreQuery(data: { query: any }): Promise<User> {
        const query2 = {};
        Object.keys(data.query).forEach((objKey) => {
            query2[objKey] = data.query[objKey];
        });
        // 取得 role 大於 0 的 資料
        query2["role"] = { [Op.gt]: 0 };
        let user: any = await (
            await this.usersRepository.findOne<User>({
                where: query2,
                include: [
                    UserDevice,
                    { model: Blacklist, as: "blacklist_userIds" },
                    { model: Blacklist, as: "blacklist_blackIds" },
                    { model: CategoryUser, include: [Category] },
                    {
                        model: NonBusinessHours,
                        // 當有 where 條件時 要有此 值 才不用 需要限制 limit 才能拉到資料
                        separate: true,
                        where: {
                            schedule: {
                                // gte 等同 >=
                                [Op.gte]: new Date(),
                            },
                            // open: {
                            // eq 等同 =
                            //     [Op.eq]: 0,
                            // },
                        },
                    },
                    WeeklyBusinessHours,
                    {
                        model: Order,
                        as: "user_orders",
                        include: [DatingDemandEnrollers],
                        // 當有 where 條件時 要有此 值 才不用 需要限制 limit 才能拉到資料
                        separate: true,
                        where: {
                            ended_at: {
                                // gte 等同 >=
                                [Op.gte]: new Date(),
                            },
                            status: {
                                // gte 等同 >=
                                [Op.gte]: OrderStatusConfig.STAT_WAITING,
                            },
                        },
                    },
                    {
                        model: Order,
                        as: "receiver_orders",
                        include: [DatingDemandEnrollers],
                        // 當有 where 條件時 要有此 值 才不用 需要限制 limit 才能拉到資料
                        separate: true,
                        where: {
                            ended_at: {
                                // gte 等同 >=
                                [Op.gte]: new Date(),
                            },
                            status: {
                                // gte 等同 >=
                                [Op.gte]: OrderStatusConfig.STAT_WAITING,
                            },
                        },
                    },
                    // 即刻快閃單
                    DatingDemands,
                    // 報名即刻快閃單人員
                    {
                        model: DatingDemandEnrollers,
                        // 當有 where 條件時 要有此 值 才不用 需要限制 limit 才能拉到資料
                        separate: true,
                        where: {
                            status: {
                                // in 等同 IN
                                [Op.in]: [DatingDemandEnrollersStatus.STAT_WAITING, DatingDemandEnrollersStatus.STAT_ACCEPTED],
                            },
                        },
                        include: [
                            {
                                model: DatingDemands,
                                // 當有 where 條件時 要有此 值 才不用 需要限制 limit 才能拉到資料
                                // separate: true,
                                where: {
                                    ended_at: {
                                        // gte 等同 >=
                                        [Op.gte]: new Date(),
                                    },
                                    status: {
                                        // gte 等同 >=
                                        [Op.gte]: DatingDemandStatus.STAT_RECRUITING,
                                    },
                                },
                            },
                        ],
                    },
                ],
            })
        ).toJSON();
        if (user === null) {
            return user;
        }
        /**
         * 圖片縮圖
         */
        const userThumbnails = await this.usersHelper.userThumbnails({
            bananaId: user.banana_id,
            gender: user.gender,
            photos: user.media.photos ?? [],
            videos: user.media.videos ?? [],
        });
        user = { ...user, ...userThumbnails };
        return user;
    }

    /**
     * 尋找全部 user 並加上分頁
     */
    async findAll(data: { filterOptions?: any; page: number; limit: number }): Promise<any> {
        // 判斷未給予預設顯示幾筆時 顯示 15筆
        data.limit = data.limit === undefined ? 15 : data.limit;
        // 判斷未給予分頁時 預設為第1頁
        data.page = data.page === undefined ? 1 : data.page;
        // 計算下次分頁資料從哪一筆開始撈取
        const offset = (Number(data.page) - 1) * data.limit;
        // 搜尋條件
        const query = {};
        // 判斷是否有給予 開始時間 跟 結束時間 key
        if (data.filterOptions.hasOwnProperty("start_date") || data.filterOptions.hasOwnProperty("end_date")) {
            // 搜尋條件採用 between (因為需要一搜尋條件找尋最後一日的結果 因此最後一日需加上 23:59:59 時辰)
            query["created_at"] = { [Op.between]: [data.filterOptions.start_date, data.filterOptions.end_date + " 23:59:59"] };
        }
        // 判斷搜尋名稱時 使用 like 條件
        if (data.filterOptions.hasOwnProperty("name")) {
            query["name"] = { [Op.substring]: data.filterOptions.name };
        }
        /**
         * 生日過濾條件 判斷開始
         */
        const birthdayQuery = {};
        const birthdaYearQuery = where(fn("year", col("birthday")), data.filterOptions.birthday_year);
        const birthdayMonthQuery = where(fn("month", col("birthday")), data.filterOptions.birthday_month);
        const birthdayDayQuery = where(fn("day", col("birthday")), data.filterOptions.birthday_day);
        // 判斷是否有傳送搜尋條件 生日年份
        if (data.filterOptions.hasOwnProperty("birthday_year")) {
            birthdayQuery[Op.and] = [{ birthday: birthdaYearQuery }];
            // 判斷是否有加上 月份 跟 日期
            if (data.filterOptions.hasOwnProperty("birthday_month")) {
                birthdayQuery[Op.and][0][Op.and] = [{ birthday: birthdayMonthQuery }];
                if (data.filterOptions.hasOwnProperty("birthday_day")) {
                    birthdayQuery[Op.and][0][Op.and][0][Op.and] = [{ birthday: birthdayDayQuery }];
                }
            }
            // 判斷是否只有日期 沒有 月份
            if (data.filterOptions.hasOwnProperty("birthday_day") && !data.filterOptions.hasOwnProperty("birthday_month")) {
                birthdayQuery[Op.and][0][Op.and] = [{ birthday: birthdayDayQuery }];
            }
        } /* 判斷傳送生日 月份搜尋條件 沒有年份 */ else if (data.filterOptions.hasOwnProperty("birthday_month")) {
            birthdayQuery[Op.and] = [{ birthday: birthdayMonthQuery }];
            // 判斷是否有傳送生日 日期條件
            if (data.filterOptions.hasOwnProperty("birthday_day")) {
                birthdayQuery[Op.and][0][Op.and] = [{ birthday: birthdayDayQuery }];
            }
        } /* 判斷傳送生日 日期搜尋條件 沒有年份 也沒有月份 */ else if (data.filterOptions.hasOwnProperty("birthday_day")) {
            birthdayQuery[Op.and] = [{ birthday: birthdayDayQuery }];
        }
        /* 生日過濾條件 判斷結束 */

        // 刪除資料表中沒有的 key 否則傳入 where 條件時會出錯
        delete data.filterOptions.page;
        delete data.filterOptions.limit;
        delete data.filterOptions.start_date;
        delete data.filterOptions.end_date;
        delete data.filterOptions.name;
        delete data.filterOptions.birthday_year;
        delete data.filterOptions.birthday_month;
        delete data.filterOptions.birthday_day;
        query[Op.and] = [data.filterOptions, birthdayQuery];
        try {
            const datas: any = await this.usersRepository.findAndCountAll<User>({
                where: query,
                offset,
                limit: Number(data.limit),
                // 預設使用  申請時間倒序
                order: [["created_at", "DESC"]],
                attributes: ["banana_id", "id", "name", "role", "birthday", "media", "created_at", "gender"],
                include: [
                    UserDevice,
                    GoogleUser,
                    FacebookUser,
                    LineUser,
                    AppleUser,
                    {
                        model: Activity,
                        attributes: ["id", "name"],
                        through: {
                            as: "pivot",
                            attributes: ["user_id", "activity_id"],
                        },
                    },
                ],
                distinct: true,
            });
            const lastPage = datas.count > 0 ? Math.ceil(datas.count / data.limit) : 0;
            const setDatas = [];
            for (let i = 0; i < datas.rows.length; i++) {
                /**
                 * 圖片縮圖
                 */
                const userThumbnails = await this.usersHelper.userThumbnails({
                    bananaId: datas.rows[i].banana_id,
                    gender: datas.rows[i].gender,
                    photos: datas.rows[i].media.photos ?? [],
                    videos: datas.rows[i].media.videos ?? [],
                });
                setDatas.push({ ...datas.rows[i].dataValues, ...userThumbnails });
            }

            console.log("data page =>", data.page);
            // console.log(setDatas);
            const result = {
                data: setDatas,
                current_page: Number(data.page),
                last_page: lastPage,
                total: datas.count,
                from: Number(data.page - 1) === 0 ? 1 : Number(data.limit) + Number(data.page - 1),
                to: Number(data.limit) * Number(data.page),
                per_page: Number(data.limit),
            };
            return result;
        } catch (err) {
            return err;
        }
    }

    // 新增
    async create(data, headers, transaction: Transaction) {
        console.timeLog("register time");
        // 驗證邀請碼是否存在 與是否可用
        if (!isEmpty(data.invitation_code)) {
            await this.invitationCodeService.verifyInvitationCodeByClient({ code: data.invitation_code });
        }
        // 生成 banana_id
        console.log("this.usersHelper.createBananaId");
        console.timeLog("register time");
        data.banana_id = await this.usersHelper.createBananaId("u", moment().valueOf());
        // 判斷有傳送密碼時才觸發
        console.log("this.usersHelper.hashPassword");
        console.timeLog("register time");
        if (data.hasOwnProperty("password")) {
            // hash password
            data.password = await this.usersHelper.hashPassword(data.password);
        }
        console.log("this.usersRepository.create");
        console.timeLog("register time");
        // 創建使用者
        const user: any = await this.usersRepository.create<User>(data, {
            transaction,
        });
        console.log("this.authService.createToken");
        console.timeLog("register time");
        // 取得 access_token
        const { access_token } = await this.authService.createToken({
            phone: user.dataValues.phone,
            userId: user.dataValues.id,
        });
        console.log("if (!access_token)");
        console.timeLog("register time");
        if (!access_token) {
            this.loggerService.error({
                title: "沒有 token 執行 rollback",
            });
            return false;
        }
        console.log("registerProducer.setFirestoreData");
        console.timeLog("register time");

        // 改用 queue work 註冊 firestore 資料
        this.registerProducer.setFirestoreData(
            transaction.afterCommit(async () => {
                console.log("setFirestoreData work =>");
                // 創建 firebase 聊天室預設資料 預設資料
                this.chatsService.firebsaeSetUserData({
                    userData: { ...user.dataValues, banana_id: user.dataValues.banana_id },
                    needResetChatToBot: true,
                    needSendWelcomeMessage: true,
                });
                // 創建 firebase 通知 預設資料
                this.notificationService.setNotificationDefaultData({
                    userId: user.dataValues.banana_id,
                });
                // 有傳送邀請碼時須戴上邀請碼值
                if (!isEmpty(data.invitation_code)) {
                    user.dataValues.invitation_code = data.invitation_code;
                }

                await this.usersService.registeredEvents(user, `Bearer ${access_token}`, headers["user-agent"]);
            }),
        );

        console.timeLog("register time");
        // 刪除密碼欄位
        delete user.dataValues.password;
        return { user, access_token };
    }

    /**
     * 尋找停權 user
     */
    async hasSuspended(data: { phone: string }): Promise<User> {
        const user = await this.usersRepository.findOne<User>({
            where: { phone: data.phone, status: { [Op.or]: [-1, -2] } },
            include: [
                {
                    model: UserFeedback,
                    attributes: ["type", "status"],
                    // where: {
                    //     type: feedbackTypes.ACCOUNT,
                    //     status: feedbackHandleStatus.QUEUING,
                    // },
                },
            ],
        });
        return user;
    }

    /**
     * 更新使用者點數
     */
    async updateUserBalance(data: { userId: number; wallet: object }, transaction: Transaction): Promise<User> {
        try {
            await this.usersRepository.update(
                { wallet: data.wallet },
                {
                    where: {
                        id: data.userId,
                    },
                    transaction,
                },
            );
            const user = this.findOne({ column: "id", value: data.userId });
            return user;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "更新使用者點數餘額失敗",
                    error: {
                        error: "n3023",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
