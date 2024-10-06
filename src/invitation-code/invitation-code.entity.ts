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
    DefaultScope,
    BelongsTo,
    ForeignKey,
} from "sequelize-typescript";

import { User } from "src/users/user.entity";

@Table({
    tableName: "invitation_codes",
})
@DefaultScope(() => ({}))
export class InvitationCode extends Model {
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

    // 代碼
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 10位數
            len: [1, 10],
        },
    })
    code: string;

    // 類別
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    type: number;

    // 狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
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

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;
}
