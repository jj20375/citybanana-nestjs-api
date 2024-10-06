import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "src/users/user.entity";
import { Badge } from "./badge.entity";

@Table({
    tableName: "badge_user",
})
export class BadgeUser extends Model {
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
    @ForeignKey(() => Badge)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    // 用 badge_id 關聯 Badge 表 id
    badge_id: number | null;

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 使用者可參與活動
    @BelongsTo(() => Badge)
    badges: Badge[];

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
