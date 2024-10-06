export enum completedOrderGrossPriceSQL {
    LAST_SEVEN_DAYS = `select 
    sum(gross_price) value,
    Date(started_At) t
    from datings 
    where 
    status in (4, 6) and
    started_At between 
    DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE()
    Group by Date(started_At)
    Order by Date(started_At) asc;
    `,
    LAST_THIRTY_DAYS = `select 
    sum(gross_price) value,
    Date(started_At) t
    from datings 
    where 
     status in (4, 6) and
    started_At between 
    DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE()
    Group by Date(started_At)
    Order by Date(started_At) asc;
    `,
    CURRENT_WEEK = `select 
    sum(gross_price) value,
    Date(started_At) t
    from datings 
    where 
     status in (4, 6) and
    YEARWEEK(started_At)=YEARWEEK(CURDATE())
    Group by Date(started_At)
    Order by Date(started_At) asc;
    `,
    LAST_WEEK = `select 
    sum(gross_price) value,
    Date(started_At) t
    from datings 
    where 
        status in (4, 6) and
    YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))
    Group by Date(started_At)
    Order by Date(started_At) asc;
    `,
    CURRENT_MONTH = `select 
    sum(gross_price) value,
    Date(started_At) t
    from datings 
    where 
     status in (4, 6) and
    started_At between 
     DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()
    Group by Date(started_At)
    Order by Date(started_At) asc;
    `,
    LAST_MONTH = `select 
    sum(gross_price) value,
    Date(started_At) t
    from datings 
    where 
     status in (4, 6) and
    started_At between 
    date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH)
    and 
    LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))
    Group by Date(started_At)
    Order by Date(started_At) asc;
        `,
    LAST_NINETY_DAYS = `select 
    sum(gross_price) value,
    DATE_FORMAT(started_At,'%Y-%m') t
    from datings 
    where 
     status in (4, 6) and
    started_At between 
    DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()
    Group by DATE_FORMAT(started_At,'%Y-%m')
    Order by DATE_FORMAT(started_At,'%Y-%m') asc;
            `,
    CURRENT_QUARTER = `
    select 
    sum(gross_price) value,
    DATE_FORMAT(started_At,'%Y-%m') t
    from datings 
    where 
     status in (4, 6) and
    quarter(Date(started_At))= quarter(CURDATE()) and 
    YEAR(Date(started_At)) = YEAR(CURDATE())
    Group by DATE_FORMAT(started_At,'%Y-%m')
    Order by DATE_FORMAT(started_At,'%Y-%m') asc;
            `,
    LAST_QUARTER = `
    select 
    sum(gross_price) value,
    DATE_FORMAT(started_At,'%Y-%m') t
    from datings 
    where 
    status in (4, 6) and
    quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter))  and 
    YEAR(Date(started_At)) = YEAR(CURDATE())
    Group by DATE_FORMAT(started_At,'%Y-%m')
    Order by DATE_FORMAT(started_At,'%Y-%m') asc;
        `,
    CURRENT_YEAR = `
    select 
    sum(gross_price) value,
    DATE_FORMAT(started_At,'%Y-%m') t
    from datings 
    where 
    status in (4, 6) and
    started_At between 
    DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE()
    Group by DATE_FORMAT(started_At,'%Y-%m')
    Order by DATE_FORMAT(started_At,'%Y-%m') asc;
        `,
    LAST_YEAR = `
    select 
    sum(gross_price) value,
    DATE_FORMAT(started_At,'%Y-%m') t
    from datings 
    where 
    status in (4, 6) and 
    year(started_At)=year(date_sub(now(),interval 1 year))
    Group by DATE_FORMAT(started_At,'%Y-%m')
    Order by DATE_FORMAT(started_At,'%Y-%m') asc;
        `,
}