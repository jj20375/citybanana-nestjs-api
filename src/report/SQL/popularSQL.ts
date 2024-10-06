export enum popularSQL {
    LAST_SEVEN_DAYS = `select 
    count(user_id) value,
    started_At t
    from datings 
    where 
    started_At between 
    DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE()
    Group by started_At
    Order by started_At asc; `,
    LAST_THIRTY_DAYS = `select 
    count(user_id) value,
    started_At t
    from datings 
    where 
    started_At between 
    DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE()
    Group by started_At
    Order by started_At asc;
    `,
    CURRENT_WEEK = `select 
    count(user_id) value,
    started_At t
    from datings 
    where 
    YEARWEEK(started_At)=YEARWEEK(CURDATE())
    Group by started_At
    Order by started_At asc;
    `,
    LAST_WEEK = `select 
    count(user_id) value,
    started_At t
    from datings 
    where 
    YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))
    Group by started_At
    Order by started_At asc;
    `,
    CURRENT_MONTH = `select 
    count(user_id) value,
    started_At t
    from datings 
    where 
    started_At between 
     DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()
    Group by started_At
    Order by started_At asc;
    `,
    LAST_MONTH = `select 
    count(user_id) value,
    started_At t
    from datings 
    where 
    started_At between 
    date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH)
    and 
    LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))
    Group by started_At
    Order by started_At asc;
        `,
    LAST_NINETY_DAYS = `select 
    count(user_id) value,
     started_At t
    from datings 
    where 
    started_At between 
    DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()
    Group by  started_At
    Order by  started_At asc;
            `,
    CURRENT_QUARTER = `
    select 
    count(user_id) value,
     started_At t
    from datings 
    where 
    quarter(Date(started_At))= quarter(CURDATE()) and 
    YEAR(Date(started_At)) = YEAR(CURDATE())
    Group by  started_At
    Order by  started_At asc;
            `,
    LAST_QUARTER = `
    select 
    count(user_id) value,
     started_At t
    from datings 
    where 
    quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter))  and 
    YEAR(Date(started_At)) = YEAR(CURDATE())
    Group by  started_At
    Order by  started_At asc;
        `,
    CURRENT_YEAR = `
    select 
    count(user_id) value,
     started_At t
    from datings 
    where 
    started_At between 
    DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE()
    Group by  started_At
    Order by  started_At asc;
        `,
    LAST_YEAR = `
    select 
    count(user_id) value,
     started_At t
    from datings 
    where 
    year(started_At)=year(date_sub(now(),interval 1 year))
    Group by  started_At
    Order by  started_At asc;
        `,
}