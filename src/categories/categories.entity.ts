import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { CategoryUser } from "src/categories/category-user/category-user.entity";

@Table({
    tableName: "categories",
})
export class Category extends Model {
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

    // 分類名稱
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

    // 更新時間
    @UpdatedAt
    @Column({
        type: DataType.DATE,
    })
    updated_at: Date;

    @HasMany(() => CategoryUser)
    category_users: CategoryUser[];
}
