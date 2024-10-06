import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from "sequelize-typescript";
@Table({
    tableName: "administrators",
})
export class AdministratorUser extends Model {
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

    // 名稱
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 32位數
            len: [1, 32],
        },
    })
    name: string;

    // 密碼
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    password?: string | null;

    // 註記
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    comment?: string;

    // 記住 token
    @Column({
        type: DataType.CHAR,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 100位數
            len: [1, 100],
        },
    })
    remember_token?: string;

    // 最後登入時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    last_login_at: Date;

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
