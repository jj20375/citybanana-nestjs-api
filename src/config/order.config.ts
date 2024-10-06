import { registerAs } from "@nestjs/config";

export default registerAs("order", () => ({
    // 折抵金最高折抵額度
    voucherMaxDiscount: process.env.USE_VOUCHER_MAX_DISCOUNT,
    // 服務商預訂單預設間隔緩衝時間
    availableDatingAfterHours: process.env.AVAILABLE_DATING_TIME_AFTER_HOURS,
    // 服務商訂單收益抽成數
    providerCommisionRate: process.env.PROVIDER_COMMISION_RATE,
    // 平台服務費
    panelFeeCommisionRate: process.env.PANEL_FEE_COMMISION_RATE,
    // 即刻快閃可選區域
    demandArea: process.env.DEMAND_AREA,
}));
