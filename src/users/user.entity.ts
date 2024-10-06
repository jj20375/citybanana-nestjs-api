import {
    Table,
    Column,
    Model,
    DataType,
    CreatedAt,
    UpdatedAt,
    HasOne,
    HasMany,
    AfterCreate,
    BelongsToMany,
    DefaultScope,
    BelongsTo,
} from "sequelize-typescript";
import * as bcrypt from "bcryptjs";
import { UserDevice } from "./user-device.entity";
import { GoogleUser } from "./google/google-user.entity";
import { UserFeedback } from "./userFeedback/userFeedback.entity";
import { ActivityUser } from "src/activity/activity-user.entity";
import { Activity } from "src/activity/activities.entity";
import { BadgeUser } from "src/badges/badge-user.entity";
import { Badge } from "src/badges/badge.entity";
import { FacebookUser } from "./facebook/facebook-user.entity";
import { LineUser } from "./line/line-user.entity";
import { AppleUser } from "./apple/apple-user.entity";
import { Authentication } from "src/authentication/authentication.entity";
import { CreditCard } from "src/credit-card/credit-card.entity";
import { Blacklist } from "src/blacklist/blacklist.entity";
import { CategoryUser } from "src/categories/category-user/category-user.entity";
import { BusinessHours } from "src/business/business-hours/business-hours.entity";
import { NonBusinessHours } from "src/business/non-business-hours/non-business-hours.entity";
import { WeeklyBusinessHours } from "src/business/weekly-business-hours/weekly-business-hours.entity";
import { Order } from "src/order/order.entity";
import { DatingDemands } from "src/demands/dating-demands/dating-demands.entity";
import { DatingDemandEnrollers } from "src/demands/dating-demands-enrollers/dating-demands-enrollers.entity";
import { Vouchers } from "src/vouchers/vouchers.entity";

import { InvitationCode } from "src/invitation-code/invitation-code.entity";
import { Promoters } from "src/promoters/promoters.entity";
@Table({
    tableName: "users",
})
@DefaultScope(() => ({
    // attributes: { exclude: ["password"] },
}))
export class User extends Model {
    @Column({
        type: DataType.BIGINT,
        // 主鍵
        primaryKey: true,
        // 自動遞增 id
        autoIncrement: true,
        // 唯一值
        unique: true,
    })
    id: number;

    // 判斷是否上線(暫時用不到 用 firebase 處理這件事 因為需要即時性)
    @Column({
        type: DataType.TINYINT,
        validate: {
            // 只能給予 0 或 1 值
            is: /^[0-1]$/i,
            isInt: {
                msg: "online 值為 0 或 1",
            },
        },
    })
    online?: number;

    // 自訂義平台使用者 id
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
        // 唯一值
        unique: true,
        validate: {
            // 最多 10位數
            len: [1, 10],
        },
        // defaultValue: async (): Promise<string> => {
        //     const r1 = getRandom(0, 9);
        //     const r2 = getRandom(0, 9);
        //     const r3 = getRandom(0, 9);
        //     let key = await scale36(moment().valueOf());
        //     key = key.toString().slice(0, 6);
        //     console.log(key);
        //     console.log(`u${key}${r1}${r2}${r3}`);
        //     // console.log(key.toString("hex"), "abc");
        //     return `u${key}${r1}${r2}${r3}`;
        // },
    })
    banana_id: string;

    // 暱稱
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    name: string;

    // 真實姓名
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    real_name: string;

    // 手機(也等同帳號)
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    phone: string;

    // 信箱
    @Column({
        type: DataType.STRING,
        // 唯一值
        unique: true,
        validate: {
            // 判斷是否符合信箱格式
            isEmail: true,
        },
    })
    email: string;

    // 手機 驗證時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    phone_verified_at: Date;

    // email 驗證時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    email_verified_at: Date;

    // 密碼
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    password?: string | null;

    // 生日
    @Column({
        type: DataType.DATE,
    })
    birthday: Date;

    // 年齡
    @Column({
        type: DataType.INTEGER,
        validate: {
            // 最大值 99
            max: 99,
            // 最小值 18
            min: 18,
        },
    })
    age: number;

    // 居住區域
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    district?: string;

    // 性別
    @Column({
        type: DataType.STRING,
    })
    gender: string;

    // 身高
    @Column({
        type: DataType.INTEGER,
        // 可為 null
        allowNull: true,
        validate: {
            // 最大值 999
            max: 999,
        },
    })
    height?: number;

    // 體重
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        validate: {
            // 最大值 999
            max: 999,
        },
    })
    weight?: number;

    // 職業
    @Column({
        type: DataType.JSON,
        // 可為 null
        allowNull: true,
    })
    occupation?: JSON;

    // 國家
    @Column({
        type: DataType.STRING,
    })
    locale: string;

    // 服務商自我介紹
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    description?: string;

    // 服務商自訂義 預訂規則說明
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    taboo?: string;

    // 是否收到email 行銷資訊
    @Column({
        type: DataType.TINYINT,
        validate: {
            // 只能給予 0 或 1 值
            is: /^[0-1]$/i,
            isInt: {
                msg: "marketing_notification 值為 0 或 1",
            },
        },
    })
    marketing_notification: number;

    // 點數相關
    @Column({
        type: DataType.JSON,
        defaultValue: {
            // 給予預設值
            balance: 0,
        },
    })
    wallet?: any;

    // 照片或影片資料
    @Column({
        type: DataType.JSON,
    })
    media?: JSON;

    // 角色（會員 = 0 | 上架服務商 = 1 | 下架服務商 = 2)
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        // 預設值 0
        defaultValue: 0,
    })
    role: number;

    // 身份驗證類型 (身分證或居留證 等等)
    @Column({
        type: DataType.INTEGER,
    })
    government_cert?: number;

    // 身分證字號 或 居留證等等
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 10位數
            len: [1, 10],
        },
    })
    government_id?: string;

    // 居住地址
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    address?: string;

    // 服務地區
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    service_area?: string;

    // 評分
    @Column({
        type: DataType.DOUBLE,
        // 預設值 "0.00"
        defaultValue: "0.00",
    })
    rating_score?: number;

    // 帳戶資料
    @Column({
        type: DataType.JSON,
    })
    banking?: JSON;

    // 平台規則同意內容
    @Column({
        type: DataType.JSON,
    })
    consent?: JSON;

    // 自訂義的歡迎訊息或任何和顯示給使用者看的資料
    @Column({
        type: DataType.JSON,
    })
    social?: JSON;

    // 使用者狀態 (使用中 = 0 ｜ 停權 = -1 ｜ 永久停權 = -1)
    @Column({
        type: DataType.TINYINT,
        // 預設值 0
        defaultValue: 0,
    })
    status: number;

    // 最後登入時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    last_login_at: Date;

    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    last_seen_at: Date;

    // 記住 token值
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
    })
    remember_token?: string;

    // 創建時間
    @CreatedAt
    @Column({
        type: DataType.DATE,
    })
    created_at: Date;

    // 更新時間
    @UpdatedAt
    @Column({
        type: DataType.DATE,
    })
    updated_at: Date;

    // 軟刪除時間
    @Column({
        type: DataType.DATE,
    })
    deleted_at?: Date;

    // 其他使用者資料設定值
    @Column({
        type: DataType.JSON,
        defaultValue: {},
        // 不可為 null
        allowNull: false,
    })
    setting: {
        // 判斷有預訂單時 是否開啟簡訊通知
        receiveDatingCreatedSMS?: number;
        // 判斷是即刻快閃活動報名被確認時 是否開啟 line 通知
        receiveDemandNotification?;
        // 每張訂單間隔 時間 （單位小時）
        datingAfterHours?: number;
        // 判斷是否開啟立即提領功能
        disableWithdraw?: boolean;
        // 判斷是否顯示生日在個人介紹頁
        enableBirthday?: number;
        // 判斷是否開啟 cityai
        enableCityAi?: number;
        // 暫時不懂用意
        plan?: any;
        [key: string]: any;
    };

    // 排序演算積分
    @Column({
        type: DataType.INTEGER,
        // 預設值 0
        defaultValue: 0,
    })
    ranking: number;

    // 可參與活動 tag
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    custom_activities: JSON;

    // 判斷服務商是否在前台隱藏
    @Column({
        type: DataType.TINYINT,
        defaultValue: 0,
    })
    stealth: number;

    /**
     * 判斷 jwt 失效時間
     */
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
        // 預設值 nul
        defaultValue: null,
    })
    valid_jwt_after: Date;

    // 行動裝置
    @HasMany(() => UserDevice)
    user_devices: UserDevice[];

    // Google 綁定
    @HasOne(() => GoogleUser)
    google_user: GoogleUser;

    // Facebook 綁定
    @HasOne(() => FacebookUser)
    facebook_user: FacebookUser;

    // Line 綁定
    @HasOne(() => LineUser)
    line_user: LineUser;

    // Apple 綁定
    @HasOne(() => AppleUser)
    apple_user: AppleUser;

    // 停權後使用者回覆訊息
    @HasMany(() => UserFeedback)
    user_feedbacks: UserFeedback[];

    // 使用者可參與活動
    @HasMany(() => ActivityUser)
    activity_user: ActivityUser[];

    @BelongsToMany(() => Activity, () => ActivityUser)
    activities: Activity[];

    // 使用者標記
    @HasMany(() => BadgeUser)
    badge_user: BadgeUser[];

    @BelongsToMany(() => Badge, () => BadgeUser)
    badges: Badge[];

    // 自己封鎖的名單
    @HasMany(() => Blacklist, { foreignKey: "user_id", as: "blacklist_userIds" })
    blacklist_userIds: Blacklist[];

    // 被封鎖的名單
    @HasMany(() => Blacklist, {
        foreignKey: "black_id",
        as: "blacklist_blackIds",
    })
    blacklist_blackIds: Blacklist[];

    // 身份驗證審核資料
    @HasOne(() => Authentication)
    authentication: Authentication;

    // 信用卡資料
    @HasMany(() => CreditCard)
    credit_cards: CreditCard[];

    // 分類資料
    @HasMany(() => CategoryUser, { foreignKey: "user_id" })
    category_user: CategoryUser[];

    // 營業時間資料(暫時用不到)
    @HasMany(() => BusinessHours, { foreignKey: "user_id" })
    business_hours: BusinessHours[];

    // 行事曆營業時間
    @HasMany(() => NonBusinessHours, { foreignKey: "user_id" })
    non_business_hours: NonBusinessHours[];

    // 每週營業時間
    @HasMany(() => WeeklyBusinessHours, { foreignKey: "user_id" })
    weekly_business_hours: WeeklyBusinessHours[];

    // 創建訂單用戶
    @HasMany(() => Order, { foreignKey: "user_id", as: "user_orders" })
    user_orders;

    // 接受訂單用戶
    @HasMany(() => Order, { foreignKey: "provider_id", as: "receiver_orders" })
    receiver_orders;

    // 即刻快閃訂單
    @HasMany(() => DatingDemands, { foreignKey: "user_id" })
    dating_demands: DatingDemands[];

    // 欲參加即刻快閃單
    @HasMany(() => DatingDemandEnrollers, { foreignKey: "user_id" })
    dating_demand_enrollers: DatingDemandEnrollers[];

    // 可使用折抵金表
    @HasMany(() => Vouchers, { foreignKey: "user_id" })
    vouchers: Vouchers[];

    // 邀請碼資料
    @HasMany(() => InvitationCode)
    invitation_codes: InvitationCode[];

    // 城市推廣人資料
    @HasOne(() => Promoters)
    promoters: Promoters;

    @AfterCreate
    static async afterCreateHook(instance: User): Promise<User> {
        // console.log(instance, "iswork");
        return instance;
    }
}
