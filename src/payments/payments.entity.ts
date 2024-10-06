import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "src/users/user.entity";
import { TransactionLogs } from "src/transaction-logs/transaction-logs.entity";
@Table({
    tableName: "payments",
})
export class Payments extends Model {
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
        // 唯一值
        unique: true,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number;

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // reason
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
    })
    reason: string;

    // type
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: true,
    })
    type: string;

    // order_id
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
    })
    order_id: string;

    // amount
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
    })
    amount: number;

    // pay_time
    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    pay_time: Date;

    // details
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    details: JSON;

    // transaction_log_id
    // 關聯表
    @ForeignKey(() => TransactionLogs)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    transaction_log_id: number;

    // 屬於 users 表關聯
    @BelongsTo(() => TransactionLogs)
    transactionLogs: TransactionLogs;

    // status
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
}
