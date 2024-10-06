import { Table, Column, Model, ForeignKey, BelongsTo, DataType, CreatedAt, UpdatedAt, HasOne, HasMany, AfterCreate } from "sequelize-typescript";
import { Vouchers } from "src/vouchers/vouchers.entity";

@Table({
    tableName: "campaigns",
})
export class Campaigns extends Model {
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

    // 優惠代碼
    @Column({
        type: DataType.CHAR,
        // 不可為 null
        allowNull: false,
        // 唯一值
        unique: true,
        validate: {
            // 最多 10位數
            len: [1, 10],
        },
    })
    code: string;

    // 促銷活動名稱
    @Column({
        type: DataType.STRING,
        // 不可為 null
        allowNull: false,
    })
    name: string;

    // 活動開始時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    started_at: Date;

    // 活動結束時間
    @Column({
        type: DataType.DATE,
        // 可為 null
        allowNull: true,
    })
    ended_at: Date;

    // 活動細節
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    details: JSON;

    // 活動內容
    @Column({
        type: DataType.JSON,
        defaultValue: {},
    })
    rewards;

    // 活動狀態
    @Column({
        type: DataType.INTEGER,
        // 不可為 null
        allowNull: false,
        defaultValue: 0,
    })
    status;

    // 最多得獎人數
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        // 唯一值
        unique: true,
        defaultValue: 0,
    })
    max_winner;

    // 限制得獎人數
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
        // 唯一值
        unique: true,
        defaultValue: 1,
    })
    reward_limit;

    @HasMany(() => Vouchers, { foreignKey: "campaign_id" })
    vouchers: Vouchers[];
}
