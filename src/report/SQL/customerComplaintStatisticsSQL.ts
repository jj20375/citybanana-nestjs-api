export enum customerComplaintStatisticsSQL {
    LAST_SEVEN_DAYS = "created_at between DATE_SUB(CURDATE() ,INTERVAL 14 DAY ) and DATE_SUB(CURDATE() ,INTERVAL 7 DAY )",
    LAST_THIRTY_DAYS = "created_at between DATE_SUB(CURDATE() ,INTERVAL 60 DAY ) and DATE_SUB(CURDATE() ,INTERVAL 30 DAY )",
    CURRENT_WEEK = "YEARWEEK(created_at)=YEARWEEK(date_sub(CURDATE(), interval 1 week))",
    LAST_WEEK = "YEARWEEK(created_at)=YEARWEEK(date_sub(CURDATE(), interval 2 week))",
    CURRENT_MONTH = "created_at between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))",
    LAST_MONTH = "created_at between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 2 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 2 Month))",
    LAST_NINETY_DAYS = "created_at between DATE_SUB(CURDATE() ,INTERVAL 180 DAY ) and DATE_SUB(CURDATE() ,INTERVAL 90 DAY )",
    CURRENT_QUARTER = "quarter(Date(created_at))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(created_at)) = YEAR(CURDATE())",
    LAST_QUARTER = "quarter(Date(created_at))= quarter(date_sub(CURDATE(), interval 2 quarter)) and YEAR(Date(created_at)) = YEAR(CURDATE())",
    CURRENT_YEAR = "year(created_at)=year(date_sub(now(),interval 1 year))",
    LAST_YEAR = "year(created_at)=year(date_sub(CURDATE(),interval 2 year))",
}
