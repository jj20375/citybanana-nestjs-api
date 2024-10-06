export const enum UserStatus {
    // 啟用中
    NORMAL = 0,
    // 身份驗證等級 1
    AUTH_LEVEL_1 = 1,
    // 身份驗證等級 2
    AUTH_LEVEL_2 = 2,
    // 停權
    SUSPENDED = -1,
    // 永久停權
    CLOSED = -2,
}
