import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "src/users/user.entity";
@Table({
    tableName: "credit_cards",
})
export class CreditCard extends Model {
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

    // 信用卡卡號
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    number: string;

    // 信用卡過期時間
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 4位數
            len: [1, 4],
        },
    })
    expiration: string;

    // 信用卡安全碼
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 3位數
            len: [1, 3],
        },
    })
    cvc: string;

    // 持卡人姓名
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    cardholder?: string | null;

    // 信用卡發卡商
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    issuer?: string | null;

    // 信用卡暱稱註記
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    comment: string;

    // 判斷是否為預設付款卡
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    is_default: number;

    // 驗證狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

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
