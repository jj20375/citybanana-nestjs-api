import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { User } from "src/users/user.entity";
import { Activity } from "./activities.entity";

@Table({
    tableName: "activity_user",
})
export class ActivityUser extends Model {
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
        allowNull: true,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number | null;

    // 關聯表
    @ForeignKey(() => Activity)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    // 用 activity_id 關聯 Activity 表 id
    activity_id: number | null;

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 使用者可參與活動
    @BelongsTo(() => Activity)
    activities: Activity[];

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
