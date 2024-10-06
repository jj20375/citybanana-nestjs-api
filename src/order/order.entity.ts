import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { Category } from "src/categories/categories.entity";
import { DatingDemandEnrollers } from "src/demands/dating-demands-enrollers/dating-demands-enrollers.entity";
import { User } from "src/users/user.entity";
@Table({
    tableName: "datings",
})
export class Order extends Model {
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

    // 關聯表
    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number;

    // 關聯表
    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 provider_id 關聯 users 表 id
    provider_id: number;

    // 關聯表
    @ForeignKey(() => Category)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 category_id 關聯 categories 表 id
    category_id: number;

    // 自訂義平台訂單 id
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
    order_id: string;

    // 訂單開始時間
    @Column({
        type: DataType.DATE,
        // 不可為 null
        allowNull: false,
    })
    started_at: Date;

    // 訂單結束時間
    @Column({
        type: DataType.DATE,
        // 不可為 null
        allowNull: false,
    })
    ended_at: Date;

    // 備註
    @Column({
        type: DataType.TEXT,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 10位數
            len: [1, 500],
        },
    })
    description?: string;

    // 活動區域
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 6位數
            len: [1, 6],
        },
    })
    district?: string;

    // 活動地點
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    location?: string;

    // 每小時單價
    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
    })
    price: number;

    // 每小時單價 * 時數 = 總價
    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
    })
    gross_price: number;

    // 已付金額
    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
    })
    paid: number;

    // 服務商訂單報酬
    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
    })
    provider_remuneration: number;

    // 訂單細節
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    details: JSON;

    // 會員排序評分
    @Column({
        type: DataType.TINYINT,
        defaultValue: 0,
    })
    user_score: number;

    // 服務商排序評分
    @Column({
        type: DataType.TINYINT,
        defaultValue: 0,
    })
    provider_score: number;

    // 會員評分內容
    @Column({
        type: DataType.TEXT,
        // 可為 null
        allowNull: true,
    })
    user_comment?: string;

    // 服務商評分內容
    @Column({
        type: DataType.TEXT,
        // 可為 null
        allowNull: true,
    })
    provider_comment?: string;

    // 訂單狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

    // 結單時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    closed_at: Date;

    // 額外小費
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    extra_tip: number;

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

    // 屬於 users 表關聯
    @BelongsTo(() => User, { foreignKey: "user_id", as: "user" })
    user: User;

    // 屬於 users 表關聯
    @BelongsTo(() => User, { foreignKey: "provider_id", as: "provider" })
    provider: User;

    @HasMany(() => DatingDemandEnrollers, { foreignKey: "dating_id" })
    dating_demand_enrollers: DatingDemandEnrollers[];

    @AfterCreate
    static async afterCreateHook(instance: User): Promise<User> {
        // console.log(instance, "iswork");
        return instance;
    }
}
