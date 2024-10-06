import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, HasMany, BelongsToMany } from "sequelize-typescript";
import { ActivityUser } from "./activity-user.entity";

@Table({
    tableName: "activities",
})
export class Activity extends Model {
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

    // 使用者可參與活動
    @HasMany(() => ActivityUser)
    activity_user: ActivityUser[];

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
