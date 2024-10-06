import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "src/users/user.entity";
@Table({
    tableName: "transaction_logs",
})
export class TransactionLogs extends Model {
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

    // vested_on
    @UpdatedAt
    @Column({
        type: DataType.DATE,
    })
    vested_on: Date;

    // Type e.g. TOP_UP, CREATE_DATING
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    type: string;

    // details
    @Column({
        type: DataType.JSON,
    })
    details?: JSON;

    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
    })
    amount: number;

    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
    })
    balance: number;

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

    // balance_id
    @ForeignKey(() => TransactionLogs)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
        // 唯一值
        unique: true,
    })
    balance_id?: number;

    // 屬於 users 表關聯
    @BelongsTo(() => TransactionLogs)
    transactionLogs: TransactionLogs;

    // broker_id
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
        // 唯一值
        unique: true,
    })
    broker_id?: number;

    // commission
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    commission: number;
}
