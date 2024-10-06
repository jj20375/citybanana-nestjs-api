import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { Order } from "../order.entity";
import { DatingDemandEnrollers } from "src/demands/dating-demands-enrollers/dating-demands-enrollers.entity";

@Table({
    tableName: "dating_extensions",
})
export class OrderExtension extends Model {
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
    @ForeignKey(() => Order)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 dating_id 關聯 datings 表 id
    dating_id: number;

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

    @HasMany(() => DatingDemandEnrollers, { foreignKey: "dating_id" })
    dating_demand_enrollers: DatingDemandEnrollers[];
}
