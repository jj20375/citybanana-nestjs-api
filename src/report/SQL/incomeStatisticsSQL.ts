export enum incomeStatisticsSQL {
    LAST_SEVEN_DAYS = "vested_on between DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE()",
    LAST_THIRTY_DAYS = "vested_on between DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE()",
    CURRENT_WEEK = "YEARWEEK(vested_on)=YEARWEEK(CURDATE())",
    LAST_WEEK = "YEARWEEK(vested_on)=YEARWEEK(date_sub(CURDATE(), interval 1 week))",
    CURRENT_MONTH = "vested_on between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()",
    LAST_MONTH = "vested_on between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))",
    LAST_NINETY_DAYS = "vested_on between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()",
    CURRENT_QUARTER = "quarter(Date(vested_on))= quarter(CURDATE()) and YEAR(Date(vested_on)) = YEAR(CURDATE())",
    LAST_QUARTER = "quarter(Date(vested_on))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(vested_on)) = YEAR(CURDATE())",
    CURRENT_YEAR = "vested_on between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(vested_on)) = YEAR(CURDATE())",
    LAST_YEAR = "year(vested_on)=year(date_sub(now(),interval 1 year))",
}
