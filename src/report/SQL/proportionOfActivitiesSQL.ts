export enum proportionOfActivitiesSQL {
    LAST_SEVEN_DAYS = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 7 DAY ) and CURDATE() group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 7 DAY ) and CURDATE() group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 7 DAY ) and CURDATE() group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 7 DAY ) and CURDATE() group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE() group by category_id ) )  AS '快閃皇后'
    from datings where status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 7 DAY ) and CURDATE()
    ;`,
    LAST_THIRTY_DAYS = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 30 DAY ) and CURDATE() group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 30 DAY ) and CURDATE() group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 30 DAY ) and CURDATE() group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and started_At between DATE_SUB(CURDATE() , INTERVAL 30 DAY ) and CURDATE() group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE() group by category_id ) )  AS '快閃皇后'
    from datings where status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 30 DAY ) and CURDATE()
    ;`,
    CURRENT_WEEK = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE())  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE())  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE())  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE())   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE())  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and YEARWEEK(started_At)=YEARWEEK(CURDATE());
    `,
    LAST_WEEK = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week))  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and YEARWEEK(started_At)=YEARWEEK(date_sub(CURDATE(), interval 1 week));
    
    `,
    CURRENT_MONTH = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE()  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-%m-01') AND CURDATE();
    `,
    LAST_MONTH = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month))  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and started_At between date_add(date_add(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month)),interval 1 DAY),interval -1 MONTH) and LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 Month));
     `,
    LAST_NINETY_DAYS = `select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE()  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and started_At between DATE_SUB(CURDATE() ,INTERVAL 90 DAY ) and CURDATE();
    `,
    CURRENT_QUARTER = `
    select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE())   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and quarter(Date(started_At))= quarter(CURDATE()) and YEAR(Date(started_At)) = YEAR(CURDATE());
            `,
    LAST_QUARTER = `
    select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE())   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and quarter(Date(started_At))= quarter(date_sub(CURDATE(), interval 1 quarter)) and YEAR(Date(started_At)) = YEAR(CURDATE());
        `,
    CURRENT_YEAR = `
    select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE())   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE())  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and started_At between DATE_FORMAT(CURDATE() ,'%Y-01-01') AND CURDATE() and YEAR(Date(started_At)) = YEAR(CURDATE());
        `,
    LAST_YEAR = `
    select 
    ((SELECT COUNT(id) FROM datings WHERE category_id = 1 and status > 0 and year(started_At)=year(date_sub(now(),interval 1 year))  group by category_id ) )  AS '吃喝玩樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 2 and status > 0 and year(started_At)=year(date_sub(now(),interval 1 year))  group by category_id ) )  AS '飲酒享樂',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 3 and status > 0 and year(started_At)=year(date_sub(now(),interval 1 year))  group by category_id ) )  AS '雲遊漫旅',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 4 and status > 0 and year(started_At)=year(date_sub(now(),interval 1 year))   group by category_id ) )  AS '工商活動',
    ((SELECT COUNT(id) FROM datings WHERE category_id = 99 and status > 0 and year(started_At)=year(date_sub(now(),interval 1 year))  group by category_id ) )  AS '快閃皇后'
    from datings 
    where 
    status > 0 and year(started_At)=year(date_sub(now(),interval 1 year));
    `,
}