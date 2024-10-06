import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { Vouchers } from "src/vouchers/vouchers.entity";

@Table({
    tableName: "voucher_logs",
})
export class VoucherLogs extends Model {
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
    @ForeignKey(() => Vouchers)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 voucher_id 關聯 vouchers 表 id
    voucher_id: number;

    // 種類
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
    })
    type: string;

    // 取得或扣除的折抵金
    @Column({
        type: DataType.BIGINT,
        // 唯一值
        unique: true,
        defaultValue: 0,
    })
    amount: number;

    // 折抵金餘額
    @Column({
        type: DataType.BIGINT,
        // 唯一值
        unique: true,
        defaultValue: 0,
    })
    balance: number;

    // 詳細內容
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    details: JSON;

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
