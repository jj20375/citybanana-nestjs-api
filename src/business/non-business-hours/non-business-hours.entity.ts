import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { User } from "src/users/user.entity";
/**
 * 行事曆營業時間
 */
@Table({
    tableName: "non_business_hours",
})
export class NonBusinessHours extends Model {
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

    // 非營業時間
    @Column({
        type: DataType.DATE,
        // 不可為 null
        allowNull: false,
    })
    schedule: Date;

    // 是否開啟營業時間
    @Column({
        type: DataType.TINYINT,
        validate: {
            // 只能給予 0 或 1 值
            is: /^[0-1]$/i,
            isInt: {
                msg: "open 值為 0 或 1",
            },
        },
        defaultValue: 1,
    })
    open: number;

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
}
