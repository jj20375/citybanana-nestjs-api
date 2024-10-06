import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { User } from "src/users/user.entity";
import { DatingDemands } from "../dating-demands/dating-demands.entity";
import { Order } from "src/order/order.entity";
/**
 * 即刻快閃訂單表
 */
@Table({
    tableName: "dating_demand_enrollers",
})
export class DatingDemandEnrollers extends Model {
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

    // 關聯表
    @ForeignKey(() => DatingDemands)
    @Column({
        type: DataType.BIGINT,
        // 唯一值
        unique: true,
        // 不可為 null
        allowNull: false,
    })
    // 用 dating_demand_id 關聯 dating_demands 表 id
    dating_demand_id: number;

    // 關聯表
    @ForeignKey(() => Order)
    @Column({
        type: DataType.BIGINT,
        // 唯一值
        unique: true,
        // 不可為 null
        allowNull: false,
    })
    // 用 dating_id 關聯 datings 表 id
    dating_id: number;

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

    // 屬於 datings 表關聯
    @BelongsTo(() => Order)
    datings: Order;

    // 屬於 dating_demands 表關聯
    @BelongsTo(() => DatingDemands)
    dating_demands: DatingDemands;
}
