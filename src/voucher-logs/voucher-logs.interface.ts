export interface IcreateVoucherLogs {
    // 關聯表 id 關聯 vouchers 表
    voucher_id: number;
    // 類別
    type: string;
    // 新增或扣除額度 (只能是正整數)
    amount: number;
    // 折抵金餘額
    balance: number;
    // 詳情
    details: object;
}
