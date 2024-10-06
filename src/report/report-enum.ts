// Time category
export enum timeCategory {
    LAST_SEVEN_DAYS = "0",
    LAST_THIRTY_DAYS = "1",
    CURRENT_WEEK = "2",
    LAST_WEEK = "3",
    CURRENT_MONTH = "4",
    LAST_MONTH = "5",
    LAST_NINETY_DAYS = "6",
    CURRENT_QUARTER = "7",
    LAST_QUARTER = "8",
    CURRENT_YEAR = "9",
    LAST_YEAR = "10",
}

// Chart type
export enum chartType {
    completedOrder = "0", // 完成訂單數
    completedOrderGrossPrice = "1", // 完成訂單總金額
    popularBookingTimes = "2", // 熱門預訂時段
    proportionOfActivities = "3", // 活動項目佔比
    proportionOfMeetingCities = "4", // 會面城市佔比
    orderStatistics = "5", // 訂單統計
    bookingCancellationTrend = "6", // 預訂取消趨勢
    incomeStatistics = "7", // 收益統計表 TODO: 還有其他項目 預訂分潤 平台服務費 臨時取消手續費 立即提領手續費
    AddUserStatistics = "8", // 新增使用者統計
    customerComplaintStatistics = "9", // 新增客訴單統計
    proportionOfCustomerComplaints = "10", // 客訴單分類佔比
    proportionOfUrgencyOfCustomerComplaints = "11", // 客訴單緊急程度佔比
}

export enum districts {
    "TW-TPE" = "台北",
    "TW-NWT" = "新北",
    "TW-KEE" = "基隆",
    "TW-ILA" = "宜蘭",
    "TW-TAO" = "桃園",
    "TW-HSZ" = "新竹",
    "TW-MIA" = "苗栗",
    "TW-TXG" = "台中",
    "TW-CHA" = "彰化",
    "TW-NAN" = "南投",
    "TW-YUN" = "雲林",
    "TW-CYI" = "嘉義",
    "TW-TNN" = "台南",
    "TW-KHH" = "高雄",
    "TW-PIF" = "屏東",
    "TW-HUA" = "花蓮",
    "TW-TTT" = "台東",
    "TW-PEN" = "澎湖",
    "TW-KIN" = "金門",
    "TW-LIE" = "連江",
}
