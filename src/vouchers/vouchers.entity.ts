import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { Campaigns } from "src/campaigns/campaigns.entity";
import { User } from "src/users/user.entity";

@Table({
    tableName: "vouchers",
})
export class Vouchers extends Model {
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

    // 關聯表
    @ForeignKey(() => Campaigns)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    // 用 campaign_id 關聯 campaigns 表 id
    campaign_id: number;

    // 活動代碼
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        validate: {
            // 最多 10 位數
            len: [1, 10],
        },
    })
    code: string;

    // 折抵金額度
    @Column({
        type: DataType.BIGINT,
        defaultValue: 0,
    })
    amount: number;

    // 折抵金 使用額度
    @Column({
        type: DataType.BIGINT,
        defaultValue: 0,
    })
    used: number;

    // 創建日期
    @Column({
        type: DataType.DATE,
        // 不可為 nul
        allowNull: false,
    })
    granted_at: Date;

    // 失效日期
    @Column({
        type: DataType.DATE,
        // 不可為 null
        allowNull: false,
    })
    expired_at: Date;

    // 詳細內容
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    details: JSON;

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

    @BelongsTo(() => Campaigns, { foreignKey: "campaign_id" })
    campaign: Campaigns;
}
