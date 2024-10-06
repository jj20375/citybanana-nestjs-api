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
} from "sequelize-typescript";
@Table({
    tableName: "short_message_logs",
})
// 全域方法 比如不回傳某個 key 值
@DefaultScope(() => ({
    // attributes: { exclude: ["id"] },
}))
export class ShortMessageLogs extends Model {
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
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 10位數
            len: [1, 10],
        },
    })
    msgid: string;

    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    phone: string;

    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
    })
    type: string;

    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    content: string;

    // 點數餘額
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
    })
    balance: number;

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
