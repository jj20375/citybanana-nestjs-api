import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { Category } from "src/categories/categories.entity";
import { User } from "src/users/user.entity";

@Table({
    tableName: "category_user",
})
export class CategoryUser extends Model {
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
    @ForeignKey(() => Category)
    @Column({
        type: DataType.BIGINT,
        // 不可為空值
        allowNull: false,
    })
    // 用 category_id 關聯 categories 表 id
    category_id: number;

    // 關聯表
    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        // 不可為空值
        allowNull: false,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number;

    // 分類每小時價格
    @Column({
        type: DataType.INTEGER,
        // 不可為空值
        allowNull: false,
        validate: {
            // 最大值 99
            max: 999999,
            // 最小值 18
            min: 1000,
        },
    })
    price: number;

    // 分類最少預訂時數
    @Column({
        type: DataType.INTEGER,
        // 不可為空值
        allowNull: false,
        validate: {
            // 最大值 99
            max: 72,
            // 最小值 18
            min: 1,
        },
    })
    min_dating_unit: number;

    // 分類最少預訂時數
    @Column({
        type: DataType.TINYINT,
        // 不可為空值
        allowNull: false,
    })
    status: number;

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

    @BelongsTo(() => User, "user_id")
    user: User;

    @BelongsTo(() => Category, { foreignKey: "category_id" })
    category: Category;
}
