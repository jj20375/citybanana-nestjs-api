export interface IcreateTransactionLogs {
    user_id: number;
    // 關聯表 id 關聯 transaction_logs 表
    balance_id?: number | null;
    // 關聯表 id 關聯 brokers 表
    broker_id?: number | null;
    // 帳務列算月份（用來判斷是哪月份的帳務）
    vested_on: string;
    // 類別
    type: string;
    // 詳情
    details: object;
    // 扣款或新增
    amount: number;
    // 帳戶剩餘額度
    balance: number;
    // 抽取佣金
    commission?: number | null;
}
