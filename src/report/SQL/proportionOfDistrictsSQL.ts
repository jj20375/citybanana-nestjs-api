export enum proportionOfDistrictsSQL {
    LAST_SEVEN_DAYS = "status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE()",
    LAST_THIRTY_DAYS = "status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE()",
    CURRENT_WEEK = "status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE())",
    LAST_WEEK = "status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))",
    CURRENT_MONTH = "status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()",
    LAST_MONTH = "status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))",
    LAST_NINETY_DAYS = "status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()",
    CURRENT_QUARTER = "status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE())",
    LAST_QUARTER = "status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE())",
    CURRENT_YEAR = "status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE())",
    LAST_YEAR = "status > 0 and year(started_At)=year(date_sub(now(),interval 1 year))",
}
