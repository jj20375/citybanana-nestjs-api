import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, BelongsTo, ForeignKey } from "sequelize-typescript";
import { User } from "../user.entity";
@Table({
    tableName: "user_feedback",
})
export class UserFeedback extends Model {
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

    // 屬於 users 表關聯
    @BelongsTo(() => User)
    user: User;

    // 處理此事件系統人員 id
    @Column({
        type: DataType.BIGINT,
        // 可為 null
        allowNull: true,
    })
    administrator_id?: number;

    // 客速對象 user id
    @Column({
        type: DataType.BIGINT,
        // 可為 null
        allowNull: true,
    })
    defendant_id: number;

    // 預訂單 id
    @Column({
        type: DataType.BIGINT,
        // 可為 null
        allowNull: true,
    })
    dating_id: number;

    // 預訂單 id
    @Column({
        type: DataType.BIGINT,
        // 可為 null
        allowNull: true,
    })
    dating_demand_id: number;

    // 客訴單類別
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
    })
    type: number;

    // 客訴單嚴重性等級
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
    })
    severity: number;

    // 信箱
    @Column({
        type: DataType.STRING,
        // 可為 null
        allowNull: true,
        // 唯一值
        unique: true,
        validate: {
            // 判斷是否符合信箱格式
            isEmail: true,
        },
    })
    email?: string;

    // 客訴內容
    @Column({
        type: DataType.TEXT,
        // 不可為 null
        allowNull: false,
    })
    feedback: string;

    // 照片或影片資料
    @Column({
        type: DataType.JSON,
    })
    media?: JSON;

    // 客訴處理狀態 (使用中 = 0 ｜ 停權 = -1 ｜ 永久停權 = -1)
    @Column({
        type: DataType.TINYINT,
        // 預設值 0
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
}
