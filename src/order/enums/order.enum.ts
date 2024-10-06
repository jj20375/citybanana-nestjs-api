export const enum OrderStatusConfig {
    // 未付款
    STAT_UNPAID = 0,
    // 等待確認
    STAT_WAITING = 1,
    // 已確認
    STAT_ACCEPTED = 2,
    // 訂單進行中
    STAT_ENJOYING = 3,
    // 訂單已結束
    STAT_COMPLETED = 4,
    // 訂單已撥款完成
    STAT_FINALIZED = 6,
    // 服務商取消訂單
    STAT_REFUSED = -1,
    // 會員取消訂單
    STAT_CANCELLED = -2,
    // 會員臨時取消訂單
    STAT_REJECTED = -3,
    // 爭議處理中訂單
    STAT_COMPLAINED = -4,
}
