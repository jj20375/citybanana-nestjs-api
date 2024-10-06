import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { User } from "src/users/user.entity";
import { DatingDemandEnrollers } from "../dating-demands-enrollers/dating-demands-enrollers.entity";
/**
 * 即刻快閃訂單表
 */
@Table({
    tableName: "dating_demands",
})
export class DatingDemands extends Model {
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
        // 唯一值
        unique: true,
        // 不可為 null
        allowNull: false,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number;

    // 自訂義即刻快閃單 id
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
    })
    demand_id: string;

    // 活動名稱
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    name: string;

    // 服務商需求人數
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    provider_required: number;

    // 服務商已報名人數
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    provider_enrolled: number;

    // 以同意已報名人數
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    provider_accepted: number;

    // 活動時長
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    hourly_pay: number;

    // 活動區域
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 6位數
            len: [1, 6],
        },
    })
    district: string;

    // 活動地點
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    location: string;

    // 報名截止時間
    @Column({
        type: DataType.DATE,
        // 不可為 null
        allowNull: false,
    })
    due_at: Date;

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

    // 訂單細節
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    details: JSON;

    // 訂單狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

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
    @BelongsTo(() => User)
    user: User;

    // 有多筆 dating_demand_enrollers 表關聯資料
    @HasMany(() => DatingDemandEnrollers, { foreignKey: "dating_demand_id" })
    dating_demand_enrollers: DatingDemandEnrollers[];
}
