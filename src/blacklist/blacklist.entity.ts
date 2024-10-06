import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { User } from "src/users/user.entity";

@Table({
    tableName: "blacklist",
})
export class Blacklist extends Model {
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

    // 關聯表
    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 black_id 關聯 users 表 id
    black_id: number;

    // 備註
    @Column({
        type: DataType.TEXT,
        // 可為 null
        allowNull: true,
    })
    note?: string;

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

    // 屬於 users 表關聯
    @BelongsTo(() => User, { foreignKey: "black_id", as: "black_user" })
    black: User;
}
