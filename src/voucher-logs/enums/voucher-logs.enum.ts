export const enum VoucherLogsTypeConfig {
    // 獲得快閃折抵金
    ADD_POINT = "EARN",
    // 使用快閃折抵金
    DROP_POINT = "BURN",
    // 快閃折抵金退還
    BACK_POINT = "REFUND",
    //  快閃折抵金過期
    EXPIRE_POINT = "EXPIRE",
    // 客服增加快閃折抵金
    SERVICE_ADD_POINT = "INCREASE",
    // 客服扣除快閃折抵金
    SERVICE_DROP_POINT = "DEDUCT",
}
