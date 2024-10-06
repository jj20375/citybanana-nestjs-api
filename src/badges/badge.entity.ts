import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, HasMany } from "sequelize-typescript";
import { BadgeUser } from "./badge-user.entity";

@Table({
    tableName: "badges",
})
export class Badge extends Model {
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

    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    name: string;

    // 創建時間
    @CreatedAt
    @Column({
        type: DataType.DATE,
    })
    created_at: Date;

    // 使用者可參與活動
    @HasMany(() => BadgeUser)
    badge_user: BadgeUser[];

    // 更新時間
    @UpdatedAt
    @Column({
        type: DataType.DATE,
    })
    updated_at: Date;
}
