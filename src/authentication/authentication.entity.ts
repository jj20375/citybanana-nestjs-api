import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import { AdministratorUser } from "src/admin/users/administrator/administrator-user.entity";
import { User } from "src/users/user.entity";
@Table({
    tableName: "authentications",
})
export class Authentication extends Model {
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

    // 類別
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
    })
    type: number;

    // 等級
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 1,
    })
    level: number;

    // 驗證狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

    // 關聯表
    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number | null;

    // 關聯表
    @ForeignKey(() => AdministratorUser)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    // 用 administrator_id 關聯 administrators 表 id
    administrator_id?: number | null;

    // 驗證資料
    @Column({
        type: DataType.JSON,
        // 不可為 null
        allowNull: false,
    })
    attachment: JSON;

    // 註記資料
    @Column({
        type: DataType.TEXT,
        // 可為 null
        allowNull: true,
    })
    comment: string;

    // 核對身份驗證時間
    @Column({
        type: DataType.DATE,
    })
    closed_at: Date;

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 屬於 users 表關聯
    @BelongsTo(() => AdministratorUser)
    administrator: AdministratorUser;

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
