import { registerAs } from "@nestjs/config";

export default registerAs("host", () => ({
    localhost: process.env.HOST,
    // 前台頁面網址
    clientHost: process.env.CLIENT_HOST,
    // php api server
    phpAPI: process.env.PHP_SERVER_CONFIG,
    // 圖片cdnURL
    cdnURL: process.env.CDN_URL,
    // 檔案路徑
    phpStorageFolder: process.env.CDN_ORIGINAL_PATH,
    // 藍新 notifyURL
    newebpayNotifyURL: `${process.env.PHP_SERVER_CONFIG}/${process.env.NEWEBPAY_NOTIFYURL}`,
    // 判斷是否啟用藍新信用卡 3D 驗證
    creditCard3DValidationEnabled: process.env.CREDIT_CARD_3DVALIDATION_ENABLED,
    // jwt 有效時間
    jwtExpiredTime: process.env.JWT_EXPIRED_TIME,
    // corn 開關
    isEnableCron: process.env.IS_ENABLE_CRON || "true",
    // cron job provider sitemap 啟動時間
    cronJobStartTimeProviderSitemap: process.env.CRON_START_TIME_PROVIDER_SITEMAP,
    // corn job 檢查虛擬單是否有服務商回應
    cronJobCheckVorderFeedback: process.env.CRON_START_TIME_CHECK_VORDER_FEEDBACK,
    // 自動回應詢問單間隔時間（小時）
    waitHoursBySystemResponseVorder: process.env.WAIT_HOURS_BY_SYSTEM_RESPONSE_VORDER,
    // 自動回應詢問單內容
    systemResponseVorderContent: process.env.SYSTEM_RESPONSE_VORDER_CONTENT,
}));
