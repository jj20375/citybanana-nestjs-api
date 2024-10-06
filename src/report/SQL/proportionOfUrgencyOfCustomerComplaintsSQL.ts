export enum proportionOfUrgencyOfCustomerComplaintsSQL {
    LAST_SEVEN_DAYS = "created_at between DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE()",
    LAST_THIRTY_DAYS = "created_at between DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE()",
    CURRENT_WEEK = "YEARWEEK(created_at)=YEARWEEK(CURDATE())",
    LAST_WEEK = "YEARWEEK(created_at)=YEARWEEK(date_sub(CURDATE(), interval 1 week))",
    CURRENT_MONTH = "created_at between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()",
    LAST_MONTH = "created_at between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))",
    LAST_NINETY_DAYS = "created_at between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()",
    CURRENT_QUARTER = "quarter(Date(created_at))= quarter(CURDATE()) and YEAR(Date(created_at)) = YEAR(CURDATE())",
    LAST_QUARTER = "quarter(Date(created_at))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(created_at)) = YEAR(CURDATE())",
    CURRENT_YEAR = "created_at between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(created_at)) = YEAR(CURDATE())",
    LAST_YEAR = "year(created_at)=year(date_sub(now(),interval 1 year))",
}
