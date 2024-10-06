import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "reports",
})
export class Report extends Model {
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

    // 建立時間作為index
    @Column({
        type: DataType.DATE,
    })
    date: Date;

    // 數據中心（完成訂單=0 完成訂單總金額=1)
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
    })
    type: number;

    // 顆粒度（過去7天=0 過去30天=1 本週=2 前週=3 本月=4 前月=5 過去90天=6 本季=7 前季=8 今年=9 去年=10 )
    @Column({
        type: DataType.TINYINT,
        // 不可為 null
        allowNull: false,
    })
    category: number;

    // 資料
    @Column({
        type: DataType.JSON,
        defaultValue: {},
        // 不可為 null
        allowNull: false,
    })
    statistics: JSON;

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
