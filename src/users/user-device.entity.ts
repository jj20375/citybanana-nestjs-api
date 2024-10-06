import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, AfterCreate, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./user.entity";
@Table({
    tableName: "user_devices",
})
export class UserDevice extends Model {
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

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 裝置 token
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
        validate: {
            len: [1, 512],
        },
    })
    token: string;

    // 類別
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    type?: string;

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
