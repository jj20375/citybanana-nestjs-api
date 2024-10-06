export interface IorderCreate {
    user_id: number;
    provider_id: number;
    category_id: number;
    order_id: string;
    // 訂單開始時間
    started_at: string;
    // 訂單結束時間
    ended_at: string;
    // 備注
    description?: string | null;
    // 區域 ex: 台北市
    district: string;
    // 地點
    location: string;
    // 每小時單價
    price: number;
    // 每小時單價 * 時數 = 總價
    gross_price: number;
    // 已付款額度
    paid: number;
    // 服務商預期收益
    provider_remuneration: number;
    // 訂單詳情
    details: object;
    // 訂單狀態
    status: number;
}

// 資料庫 details 欄位 資料
export interface IorderDetails {
    // 每小時單價 * 預訂時數
    serviceCharge: number;
    // 每小時單價
    hourlyPrice: number;
    // 預訂時數
    duration: number;
    // 小費
    tip: number;
    // 平台服務費
    fee: number;
    // 服務商收益
    providerRemuneration: number;
    // 訂單合計
    price: number;
    // 訂單合計加上服務費
    total: number;
}
