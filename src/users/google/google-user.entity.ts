import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, AfterCreate, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "../user.entity";
@Table({
    tableName: "google_users",
})
export class GoogleUser extends Model {
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

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 第三方登入帳號 id
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    account_id: string;

    // 信箱
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        // 唯一值
        unique: true,
        validate: {
            // 判斷是否為信箱
            isEmail: true,
        },
    })
    email?: string;

    // 姓氏
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    family_name?: string;

    // 姓名
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    given_name?: string;

    // 全名
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    name?: string;

    // gsuite 網站網址
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    gsuite_domain?: string;

    // 國家
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 5位數
            len: [1, 5],
        },
    })
    locale?: string;

    // 照片
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        validate: {
            // 最多 255位數
            len: [1, 255],
        },
    })
    picture?: string;

    // 狀態
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        // 預設值 0
        defaultValue: 0,
    })
    status: number;

    // 最後登入時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    last_login_at?: Date;

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
    dataValues: GoogleUser | PromiseLike<GoogleUser>;
}
