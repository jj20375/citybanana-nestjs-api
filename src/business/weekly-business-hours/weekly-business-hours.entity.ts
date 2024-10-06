import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { User } from "src/users/user.entity";
/**
 * 每週營業時間
 */
@Table({
    tableName: "weekly_business_hours",
})
export class WeeklyBusinessHours extends Model {
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
        // 不可為 null
        allowNull: false,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number;

    // 關閉的星期幾
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        validate: {
            min: 1,
            max: 7,
        },
    })
    weekday: number;

    // 關閉的營業時間
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        validate: {
            min: 0,
            max: 23,
        },
    })
    close: number;

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
