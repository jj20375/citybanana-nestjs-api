import {
    Table,
    Column,
    Model,
    DataType,
    CreatedAt,
    UpdatedAt,
    HasOne,
    HasMany,
    AfterCreate,
    BelongsToMany,
    BelongsTo,
    DefaultScope,
    ForeignKey,
} from "sequelize-typescript";

import { User } from "src/users/user.entity";

import { LineUser } from "src/users/line/line-user.entity";

@Table({
    tableName: "promoters",
})
@DefaultScope(() => ({}))
export class Promoters extends Model {
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

    // 社群媒體資料
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        defaultValue: {},
    })
    social?: string;

    // 備註訊息
    @Column({
        type: DataType.TEXT,
        // 不可為 null
        allowNull: false,
    })
    comment: string;

    // 聯絡資訊
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    contact: string;

    // 匯款資訊
    @Column({
        type: DataType.JSON,
        // 不可為 null
        allowNull: false,
        defaultValue: {},
    })
    banking: JSON;

    // 更改狀態log
    @Column({
        type: DataType.JSON,
        // 不可為 null
        allowNull: false,
        defaultValue: {},
    })
    log: JSON;

    // 狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    status: number;

    @Column({
        type: DataType.INET,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    revenue: number;

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
    @BelongsTo(() => User)
    user: User;
}
