import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "src/users/user.entity";
import { AdministratorUser } from "src/admin/users/administrator/administrator-user.entity";
@Table({
    tableName: "platform_logs",
})
export class PlatformLogs extends Model {
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

    // level
    @Column({
        type: DataType.CHAR,
        allowNull: false,
    })
    level: string;

    // type
    @Column({
        type: DataType.CHAR,
        allowNull: false,
    })
    type: string;

    // action
    @Column({
        type: DataType.CHAR,
        allowNull: false,
    })
    action: string;

    // 關聯表
    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        // 可為 null
        allowNull: true,
        // 唯一值
        unique: true,
    })
    // 用 user_id 關聯 users 表 id
    user_id: number;

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 關聯表
    @ForeignKey(() => AdministratorUser)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
        // 唯一值
        unique: true,
    })
    // 用 authentication_id 關聯 authentications 表 id
    administrator_id: number;

    // 屬於 authentication 表關聯
    @BelongsTo(() => AdministratorUser)
    authentication: AdministratorUser;

    // address
    @Column({
        type: DataType.JSON,
    })
    address?: JSON;

    // payload
    @Column({
        type: DataType.JSON,
    })
    payload?: JSON;

    // target_type
    @Column({
        type: DataType.CHAR,
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    target_type?: string;

    // target_id
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
        // 唯一值
        unique: true,
    })
    target_id: number;

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
