import { Injectable, Inject } from "@nestjs/common";

import moment from "moment";
import "twix";
import { Order } from "src/order/order.entity";
import { UserFeedback } from "src/users/userFeedback/userFeedback.entity";
import { timeCategory, chartType, districts } from "src/report/report-enum";
import { comletedOrderSQL } from "src/report/SQL/comletedOrderSQL";
import { completedOrderGrossPriceSQL } from "src/report/SQL/completedOrderGrossPriceSQL";
import { proportionOfActivitiesSQL } from "src/report/SQL/proportionOfActivitiesSQL";
import { proportionOfDistrictsSQL } from "src/report/SQL/proportionOfDistrictsSQL";
import { orderStatisticsSQL } from "src/report/SQL/orderStatisticsSQL";
import { proportionOfUrgencyOfCustomerComplaintsSQL } from "src/report/SQL/proportionOfUrgencyOfCustomerComplaintsSQL";
import { incomeStatisticsSQL } from "src/report/SQL/incomeStatisticsSQL";
import { customerComplaintStatisticsSQL } from "src/report/SQL/customerComplaintStatisticsSQL";
import { popularSQL } from "src/report/SQL/popularSQL";

@Injectable()
export class ReportHelperService {
    // private cdnURL: string;
    // private phpStorageFolder: string;
    constructor(
        @Inject("ORDER_REPOSITORY")
        private orderRepository: typeof Order,
        @Inject("USERFEEDBACK_REPOSITORY")
        private UserFeedbackRepository: typeof UserFeedback
    ) {}

    async statistics(type, category: string): Promise<any> {
        const { sql } = await this.statisticsSwitch(type, category);
        if (type == chartType.customerComplaintStatistics) {
            const [resultsCurrent] = await this.orderRepository.sequelize.query(sql.current);
            const currentOk: any = resultsCurrent[0];
            const [resultsLast] = await this.orderRepository.sequelize.query(sql.last);
            const lastOk: any = resultsLast[0];
            const result: any = ((currentOk.value - lastOk.value) / lastOk.value) * 100;

            if (isNaN(result) || !isFinite(result)) {
                return {
                    count: currentOk.value,
                    rate: "0",
                };
            }
            return {
                count: currentOk.value,
                rate: result.toFixed(2),
            };
        }
        if (type == chartType.AddUserStatistics) {
            const [resultsOrder] = await this.orderRepository.sequelize.query(sql.sql);
            const orderOk: any = resultsOrder[0];
            let new_orderOk = [];
            if (orderOk !== undefined) {
                new_orderOk = Object.keys(orderOk).map((i) => ({
                    value: orderOk[i] === null ? 0 : parseFloat(orderOk[i]),
                    name: i,
                }));
            } else {
                new_orderOk.push(
                    {
                        value: 0,
                        name: "providers",
                    },
                    {
                        value: 0,
                        name: "members",
                    }
                );
            }
            return new_orderOk;
        }

        if (type == chartType.incomeStatistics) {
            const [resultsOrder] = await this.orderRepository.sequelize.query(sql.sql);
            const orderOk: any = resultsOrder[0];
            let new_orderOk = [];
            if (orderOk !== undefined) {
                new_orderOk = Object.keys(orderOk).map((i) => ({
                    value: orderOk[i] === null ? 0 : parseFloat(orderOk[i]),
                    name: i,
                }));
            } else {
                new_orderOk.push({
                    rate: "0.00",
                    count: 0,
                });
            }
            return new_orderOk;
        }
        if (type == chartType.orderStatistics) {
            const [resultsOrder] = await this.orderRepository.sequelize.query(sql.originOrderSQL);
            const orderOk: any = resultsOrder[0];
            const new_orderOk = Object.keys(orderOk).map((i) => ({
                value: orderOk[i] === null ? 0 : parseFloat(orderOk[i]),
                name: i,
            }));

            const [resultsScore] = await this.orderRepository.sequelize.query(sql.originScoreSQL);
            const scoreOk: any = resultsScore[0];
            const new_scoreOk = Object.keys(scoreOk).map((i) => ({
                value: scoreOk[i] === null ? 0 : parseFloat(scoreOk[i]),
                name: i,
            }));

            return new_scoreOk.concat(new_orderOk);
        }
    }

    async statisticsSwitch(type, category: string): Promise<any> {
        let sql;
        switch (category) {
            case timeCategory.LAST_SEVEN_DAYS:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_SEVEN_DAYS);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_SEVEN_DAYS);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_SEVEN_DAYS);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_SEVEN_DAYS,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_SEVEN_DAYS
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            case timeCategory.LAST_THIRTY_DAYS:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_THIRTY_DAYS);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_THIRTY_DAYS);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_THIRTY_DAYS);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_THIRTY_DAYS,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_THIRTY_DAYS
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            case timeCategory.CURRENT_WEEK:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.CURRENT_WEEK);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_WEEK);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.CURRENT_WEEK);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.CURRENT_WEEK,
                            proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_WEEK
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            case timeCategory.LAST_WEEK:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_WEEK);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_WEEK);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_WEEK);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_WEEK,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_WEEK
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 本月
            case timeCategory.CURRENT_MONTH:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.CURRENT_MONTH);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_MONTH);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.CURRENT_MONTH);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.CURRENT_MONTH,
                            proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_MONTH
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 前月
            case timeCategory.LAST_MONTH:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_MONTH);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_MONTH);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_MONTH);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_MONTH,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_MONTH
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 過去90天
            case timeCategory.LAST_NINETY_DAYS:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_NINETY_DAYS);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_NINETY_DAYS);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_NINETY_DAYS);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_NINETY_DAYS,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_NINETY_DAYS
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 本季
            case timeCategory.CURRENT_QUARTER:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.CURRENT_QUARTER);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_QUARTER);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.CURRENT_QUARTER);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.CURRENT_QUARTER,
                            proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_QUARTER
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 前季
            case timeCategory.LAST_QUARTER:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_QUARTER);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_QUARTER);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_QUARTER);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_QUARTER,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_QUARTER
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 今年
            case timeCategory.CURRENT_YEAR:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.CURRENT_YEAR);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_YEAR);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.CURRENT_YEAR);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.CURRENT_YEAR,
                            proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_YEAR
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 去年
            case timeCategory.LAST_YEAR:
                switch (type) {
                    case chartType.orderStatistics:
                        sql = await this.statisticsSQL(orderStatisticsSQL.LAST_YEAR);
                        break;
                    case chartType.AddUserStatistics:
                        sql = await this.addUserStatisticsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_YEAR);
                        break;
                    case chartType.incomeStatistics:
                        sql = await this.incomeStatisticsSQL(incomeStatisticsSQL.LAST_YEAR);
                        break;
                    case chartType.customerComplaintStatistics:
                        sql = await this.customerComplaintStatisticsSQL(
                            customerComplaintStatisticsSQL.LAST_YEAR,
                            proportionOfUrgencyOfCustomerComplaintsSQL.LAST_YEAR
                        );
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            default:
                break;
        }
    }

    async customerComplaintStatisticsSQL(lastTemplateSql, currentTemplateSql: string): Promise<any> {
        const current = `SELECT 
        count(*) as value
        FROM user_feedback
        where
        ${currentTemplateSql}
        `;
        const last = `SELECT 
        count(*) as value
        FROM user_feedback
        where
        ${lastTemplateSql}
        `;

        return {
            current,
            last,
        };
    }

    async incomeStatisticsSQL(templateSql: string): Promise<any> {
        const sql = `
        SELECT 
        (select sum(amount) as 淨儲值額 from transaction_logs where type = 'TOP_UP' and ${templateSql}) as 淨儲值額,
        (select abs(sum(amount)) as 淨撥款額 from transaction_logs where type in ('WITHDRAW', 'CHARGE_OFF', 'CASH') and amount < 0 and ${templateSql}) as 淨撥款額,
        (select sum(amount) as 平台總收益 from transaction_logs where user_id = 1 and ${templateSql}) as 平台總收益
        from transaction_logs where ${templateSql};
        `;
        return { sql };
    }

    async statisticsSQL(templateSql: string): Promise<any> {
        // 評分平均
        const originScoreSQL = `
        select avg(provider_score) as avg_score
        from datings 
        where provider_score > 0 and 
        ${templateSql}
        `;
        // 預訂成功率 & 主動取消率 & 被動取消率 & 會員取消率 & 會員取消率 & 訂單回應率
        const originOrderSQL = `
        SELECT 
        ((SELECT COUNT(id) FROM datings WHERE provider_remuneration > 0 and status in (4, 6) and ${templateSql} ) / COUNT(id) *100 )  AS 'booking_success_rate',
        ((SELECT count(JSON_EXTRACT(details, "$.refusedNote")) AS value FROM datings WHERE JSON_EXTRACT(details, "$.refusedNote") != '服務商逾時未回覆' and status = -1 and  ${templateSql} ) / count(JSON_EXTRACT(details, "$.refusedNote")) *100 )  AS 'active_cancellation_rate',
        ((SELECT count(JSON_EXTRACT(details, "$.refusedNote")) AS refusedNote FROM datings WHERE JSON_EXTRACT(details, "$.refusedNote") = '服務商逾時未回覆' and status = -1 and  ${templateSql} ) / count(JSON_EXTRACT(details, "$.refusedNote")) *100 )  AS 'passive_cancellation_rate',
        ((SELECT count(id) AS refusedNote FROM datings WHERE status = -2 and  ${templateSql} ) / COUNT(id) *100 )  AS 'member_cancel_rate',
        ((SELECT count(id) AS refusedNote FROM datings WHERE status = -3 and  ${templateSql} ) / COUNT(id) *100 )  AS 'member_temporary_cancel_rate',
        ((SELECT count(user_id) FROM datings WHERE JSON_EXTRACT(details, "$.refusedNote") != '服務商逾時未回覆' and status in (-1) and ${templateSql} or status in (2, 3, 4, 6, -4) and  ${templateSql} ) / COUNT(id) *100 )  AS 'response_rate'
        FROM datings WHERE ${templateSql};
        `;

        return {
            originScoreSQL,
            originOrderSQL,
        };
    }

    async addUserStatisticsSQL(templateSql: string): Promise<any> {
        const sql = `
        SELECT 
        (select count(*) as providers from users where role = 0 and ${templateSql}) as providers,
        (select count(*) as members from users where role in (1, 2) and ${templateSql}) as members
        from users where ${templateSql};
        `;
        return {
            sql,
        };
    }

    async pieChart(type, category: string): Promise<any> {
        const { sql } = await this.pieChartSwitch(type, category);
        const [results] = await this.UserFeedbackRepository.sequelize.query(sql);
        const ok: any[] = results;
        let new_db_result = [];
        if (type == chartType.proportionOfUrgencyOfCustomerComplaints) {
            if (ok.length !== 0) {
                new_db_result = Object.keys(ok[0]).map((i) => ({
                    value: ok[0][i] === null ? 0 : parseFloat(ok[0][i]),
                    name: i,
                }));
            } else {
                new_db_result.push(
                    {
                        value: 0,
                        name: "低等",
                    },
                    {
                        value: 0,
                        name: "中等",
                    },
                    {
                        value: 0,
                        name: "高等",
                    }
                );
            }
        }
        if (type == chartType.proportionOfCustomerComplaints) {
            // Check data is exist
            if (ok.length !== 0) {
                new_db_result = Object.keys(ok[0]).map((i) => ({
                    value: ok[0][i] === null ? 0 : parseFloat(ok[0][i]),
                    name: i,
                }));
            } else {
                new_db_result.push(
                    {
                        name: "用戶帳號相關",
                        value: 0,
                    },
                    {
                        name: "聊天室檢舉",
                        value: 0,
                    },
                    {
                        name: "預訂相關",
                        value: 0,
                    },
                    {
                        name: "會員儲值相關",
                        value: 0,
                    },
                    {
                        name: "服務商款項相關",
                        value: 0,
                    },
                    {
                        name: "平台相關",
                        value: 0,
                    },
                    {
                        name: "行程突發事件",
                        value: 0,
                    },
                    {
                        name: "即刻快閃相關",
                        value: 0,
                    },
                    {
                        name: "其他分類",
                        value: 0,
                    }
                );
            }
        }

        // translation
        if (type == chartType.proportionOfMeetingCities) {
            if (ok.length !== 0) {
                new_db_result = Object.entries(ok[0]).map((i) => ({
                    name: districts[i[0]],
                    value: i[1] === null ? 0 : i[1],
                }));
            } 
        }

        if (type == chartType.proportionOfActivities) {
            if (ok.length !== 0) {
                new_db_result = Object.keys(ok[0]).map((i) => ({
                    value: ok[0][i] === null ? 0 : parseFloat(ok[0][i]),
                    name: i,
                }));
            } else {
                new_db_result.push(
                    {
                        value: 0,
                        name: "吃喝玩樂",
                    },
                    {
                        value: 0,
                        name: "飲酒享樂",
                    },
                    {
                        value: 0,
                        name: "雲遊漫旅",
                    },
                    {
                        value: 0,
                        name: "工商活動",
                    },
                    {
                        value: 0,
                        name: "快閃皇后",
                    }
                );
            }
        }

        return new_db_result;
    }

    async popularChart(type, category: string): Promise<any> {
        const sql = await this.popularSwitch(type, category);
        const [popularResults] = await this.orderRepository.sequelize.query(sql);
        const ok: any[] = popularResults;

        return this.popular(ok);
    }
    /**
     *
     * @returns
     */
    async lineGraph(type, category: string): Promise<any> {
        // category
        const { sql, range } = await this.lineGraphSwitch(type, category);
        const dates = [];
        const val = [];
        // Cancellation trend
        if (type == chartType.bookingCancellationTrend) {
            const [active_cancellation_results] = await this.orderRepository.sequelize.query(sql.active_cancellation);
            const [passive_cancellation_results] = await this.orderRepository.sequelize.query(sql.passive_cancellation);
            const [member_cancel_results] = await this.orderRepository.sequelize.query(sql.member_cancel);
            const [member_temporary_cancel_results] = await this.orderRepository.sequelize.query(sql.member_temporary_cancel);
            let active_cancellation = await this.addDaytool(active_cancellation_results, range);
            active_cancellation = active_cancellation.map((i) => {
                return i.value;
            });
            val.push({
                name: "自動婉拒（未回覆）",
                data: active_cancellation,
            });
            let passive_cancellation = await this.addDaytool(passive_cancellation_results, range);
            passive_cancellation = passive_cancellation.map((i) => {
                return i.value;
            });
            val.push({
                name: "服務商婉拒",
                data: passive_cancellation,
            });
            let member_cancel = await this.addDaytool(member_cancel_results, range);
            member_cancel = member_cancel.map((i) => {
                return i.value;
            });
            val.push({
                name: "會員取消",
                data: member_cancel,
            });
            let member_temporary_cancel = await this.addDaytool(member_temporary_cancel_results, range);
            member_temporary_cancel = member_temporary_cancel.map((i) => {
                dates.push(i.t);
                return i.value;
            });
            val.push({
                name: "會員臨時取消",
                data: member_temporary_cancel,
            });
        }
        if (type == chartType.completedOrder) {
            const [results] = await this.orderRepository.sequelize.query(sql);
            const ok: any[] = results;

            const order_result = await this.addDaytool(ok, range);

            order_result.forEach((e) => {
                dates.push(e.t);
                val.push(parseInt(e.value));
            });
        }
        if (type == chartType.completedOrderGrossPrice) {
            const [results] = await this.orderRepository.sequelize.query(sql);
            const ok: any[] = results;

            const order_result = await this.addDaytool(ok, range);

            order_result.forEach((e) => {
                dates.push(e.t);
                val.push(parseInt(e.value));
            });
        }
        return {
            dates,
            val,
        };
    }

    async addDaytool(ok, range: any[]): Promise<any> {
        const new_db_result = ok.map((i) => i.t);
        const difference = range
            .filter((x) => !new_db_result.includes(x))
            .map((e) => {
                return {
                    value: 0,
                    t: e,
                };
            });

        const result = [...difference, ...ok].sort((a, b) => {
            const c = new Date(a.t);
            const d = new Date(b.t);
            return c > d ? 1 : -1;
        });

        return result;
    }

    /**
     * 補齊日期
     * @param { type Number(數字)} time
     */
    async autoDay(category: string): Promise<string[]> {
        const range = [];
        let itr;
        switch (category) {
            // 過去7天
            case timeCategory.LAST_SEVEN_DAYS:
                itr = moment().subtract(5, "days").twix(moment().subtract(1, "days")).iterate("days");
                break;
            // 過去30天
            case timeCategory.LAST_THIRTY_DAYS:
                itr = moment().subtract(30, "days").twix(moment().subtract(1, "days")).iterate("days");
                break;
            // 本週
            case timeCategory.CURRENT_WEEK:
                itr = moment().startOf("isoWeek").twix(moment().subtract(-1, "weeks").startOf("week")).iterate("days");
                break;
            // 前週
            case timeCategory.LAST_WEEK:
                itr = moment().subtract(1, "weeks").startOf("isoWeek").twix(moment().subtract(1, "weeks").endOf("isoWeek")).iterate("days");
                break;
            // 本月
            case timeCategory.CURRENT_MONTH:
                itr = moment().startOf("month").twix(moment().subtract(1, "days")).iterate("days");
                break;
            // 前月
            case timeCategory.LAST_MONTH:
                itr = moment().subtract(1, "month").startOf("month").twix(moment().subtract(1, "month").endOf("month")).iterate("days");
                break;
            // 過去90天
            case timeCategory.LAST_NINETY_DAYS:
                itr = moment().subtract(90, "days").twix(moment().subtract(1, "days")).iterate("months");
                break;
            // 本季
            case timeCategory.CURRENT_QUARTER:
                itr = moment().startOf("quarter").twix(moment().subtract(1, "days")).iterate("months");
                break;
            // 前季
            case timeCategory.LAST_QUARTER:
                itr = moment().subtract(1, "quarter").startOf("quarter").twix(moment().subtract(1, "quarter").endOf("quarter")).iterate("months");
                break;
            // 今年
            case timeCategory.CURRENT_YEAR:
                itr = moment().startOf("year").twix(moment().subtract(1, "days")).iterate("months");
                break;
            // 去年
            case timeCategory.LAST_YEAR:
                itr = moment().subtract(1, "year").startOf("year").twix(moment().subtract(1, "year").endOf("year")).iterate("months");
                break;
            default:
                break;
        }

        while (itr.hasNext()) {
            if (parseInt(category) < 6) {
                range.push(itr.next().format("yyyy-MM-DD"));
            } else {
                range.push(itr.next().format("yyyy-MM"));
            }
        }
        return range;
    }

    async popularSwitch(type, category: string): Promise<any> {
        let sql;
        let range;
        switch (category) {
            case timeCategory.LAST_SEVEN_DAYS:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_SEVEN_DAYS;
                        break;
                    default:
                        break;
                }
                break;
            case timeCategory.LAST_THIRTY_DAYS:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_THIRTY_DAYS;
                        break;
                    default:
                        break;
                }
                break;
            case timeCategory.CURRENT_WEEK:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.CURRENT_WEEK;
                        break;
                    default:
                        break;
                }
                break;
            case timeCategory.LAST_WEEK:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_WEEK;
                        break;
                    default:
                        break;
                }
                break;

            case timeCategory.CURRENT_MONTH:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.CURRENT_MONTH;
                        break;
                    default:
                        break;
                }
                break;

            case timeCategory.LAST_MONTH:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_MONTH;
                        break;
                    default:
                        break;
                }
                break;

            case timeCategory.LAST_NINETY_DAYS:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_NINETY_DAYS;
                        break;
                    default:
                        break;
                }
                break;

            case timeCategory.CURRENT_QUARTER:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.CURRENT_QUARTER;
                        break;
                    default:
                        break;
                }
                break;
            case timeCategory.LAST_QUARTER:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_QUARTER;
                        break;
                    default:
                        break;
                }
                break;
            case timeCategory.CURRENT_YEAR:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.CURRENT_YEAR;
                        break;
                    default:
                        break;
                }
                break;

            case timeCategory.LAST_YEAR:
                switch (type) {
                    case chartType.popularBookingTimes:
                        sql = popularSQL.LAST_YEAR;
                        break;
                    default:
                        break;
                }
                break;

            default:
                break;
        }
        return sql;
    }

    /**
     * 增加SQL
     * @param category
     * @returns
     */
    async lineGraphSwitch(type, category: string): Promise<any> {
        let sql;
        let range;
        switch (category) {
            case timeCategory.LAST_SEVEN_DAYS:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_SEVEN_DAYS;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_SEVEN_DAYS;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.LESS_NINE_DAY, orderStatisticsSQL.LAST_SEVEN_DAYS);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            case timeCategory.LAST_THIRTY_DAYS:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_THIRTY_DAYS;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_THIRTY_DAYS;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.LESS_NINE_DAY, orderStatisticsSQL.LAST_THIRTY_DAYS);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            case timeCategory.CURRENT_WEEK:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.CURRENT_WEEK;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.CURRENT_WEEK;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.LESS_NINE_DAY, orderStatisticsSQL.CURRENT_WEEK);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            case timeCategory.LAST_WEEK:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_WEEK;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_WEEK;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.LESS_NINE_DAY, orderStatisticsSQL.LAST_WEEK);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 本月
            case timeCategory.CURRENT_MONTH:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.CURRENT_MONTH;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.CURRENT_MONTH;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.LESS_NINE_DAY, orderStatisticsSQL.CURRENT_MONTH);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 前月
            case timeCategory.LAST_MONTH:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_MONTH;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_MONTH;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.LESS_NINE_DAY, orderStatisticsSQL.LAST_MONTH);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 過去90天
            case timeCategory.LAST_NINETY_DAYS:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_NINETY_DAYS;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_NINETY_DAYS;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.MORE_NINE_DAY, orderStatisticsSQL.LAST_NINETY_DAYS);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 本季
            case timeCategory.CURRENT_QUARTER:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.CURRENT_QUARTER;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.CURRENT_QUARTER;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.MORE_NINE_DAY, orderStatisticsSQL.CURRENT_QUARTER);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 前季
            case timeCategory.LAST_QUARTER:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_QUARTER;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_QUARTER;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.MORE_NINE_DAY, orderStatisticsSQL.LAST_QUARTER);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 今年
            case timeCategory.CURRENT_YEAR:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.CURRENT_YEAR;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.CURRENT_YEAR;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.MORE_NINE_DAY, orderStatisticsSQL.CURRENT_YEAR);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            // 去年
            case timeCategory.LAST_YEAR:
                switch (type) {
                    case chartType.completedOrder:
                        sql = comletedOrderSQL.LAST_YEAR;
                        break;
                    case chartType.completedOrderGrossPrice:
                        sql = completedOrderGrossPriceSQL.LAST_YEAR;
                        break;
                    case chartType.bookingCancellationTrend:
                        sql = await this.bookingCancellationTrendSQL(orderStatisticsSQL.MORE_NINE_DAY, orderStatisticsSQL.LAST_YEAR);
                        break;
                    default:
                        break;
                }
                range = await this.autoDay(category);
                return {
                    sql,
                    range,
                };
            default:
                break;
        }
    }

    async pieChartSwitch(type, category: string): Promise<any> {
        let sql;
        switch (category) {
            case timeCategory.LAST_SEVEN_DAYS:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_SEVEN_DAYS;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_SEVEN_DAYS);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_SEVEN_DAYS);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_SEVEN_DAYS);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            case timeCategory.LAST_THIRTY_DAYS:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_THIRTY_DAYS;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_THIRTY_DAYS);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_THIRTY_DAYS);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_THIRTY_DAYS);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            case timeCategory.CURRENT_WEEK:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.CURRENT_WEEK;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.CURRENT_WEEK);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_WEEK);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_WEEK);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            case timeCategory.LAST_WEEK:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_WEEK;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_WEEK);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_WEEK);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_WEEK);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 本月
            case timeCategory.CURRENT_MONTH:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.CURRENT_MONTH;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.CURRENT_MONTH);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_MONTH);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_MONTH);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 前月
            case timeCategory.LAST_MONTH:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_MONTH;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_MONTH);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_MONTH);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_MONTH);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 過去90天
            case timeCategory.LAST_NINETY_DAYS:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_NINETY_DAYS;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_NINETY_DAYS);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_NINETY_DAYS);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_NINETY_DAYS);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 本季
            case timeCategory.CURRENT_QUARTER:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.CURRENT_QUARTER;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.CURRENT_QUARTER);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_QUARTER);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_QUARTER);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 前季
            case timeCategory.LAST_QUARTER:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_QUARTER;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_QUARTER);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_QUARTER);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_QUARTER);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 今年
            case timeCategory.CURRENT_YEAR:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.CURRENT_YEAR;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.CURRENT_YEAR);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_YEAR);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.CURRENT_YEAR);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            // 去年
            case timeCategory.LAST_YEAR:
                switch (type) {
                    case chartType.proportionOfActivities:
                        sql = proportionOfActivitiesSQL.LAST_YEAR;
                        break;
                    case chartType.proportionOfMeetingCities:
                        sql = await this.proportionOfDistrictsSQL(proportionOfDistrictsSQL.LAST_YEAR);
                        break;
                    case chartType.proportionOfCustomerComplaints:
                        sql = await this.proportionOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_YEAR);
                        break;
                    case chartType.proportionOfUrgencyOfCustomerComplaints:
                        sql = await this.proportionOfUrgencyOfCustomerComplaintsSQL(proportionOfUrgencyOfCustomerComplaintsSQL.LAST_YEAR);
                        break;
                    default:
                        break;
                }
                return {
                    sql,
                };
            default:
                break;
        }
    }

    async proportionOfDistrictsSQL(templateSql: string): Promise<any> {
        const sql = `select distinct(district) from datings;`;
        const [results] = await this.orderRepository.sequelize.query(sql);
        const ok: any[] = results;
        const districts = ok.map((i) => i.district);
        let districtsSQLs = "";
        districts.forEach((district, i) => {
            const districtsSQL = `((SELECT COUNT(id) FROM datings WHERE district = '${district}' and ${templateSql} group by district ) )  AS '${district}'`;
            if (i == districts.length - 1) {
                districtsSQLs += " " + districtsSQL;
            } else {
                districtsSQLs += districtsSQL + ",";
            }
        });

        const originSQL = `
        select
        ${districtsSQLs}
        from datings 
        where 
        ${templateSql}
        `;

        return originSQL;
    }

    async proportionOfUrgencyOfCustomerComplaintsSQL(templateSql: string): Promise<any> {
        const originSQL = `
        select
        ((SELECT COUNT(id) FROM user_feedback WHERE severity = 0 and ${templateSql} )) AS '低等',
        ((SELECT COUNT(id) FROM user_feedback WHERE severity = 1 and ${templateSql} )) AS '中等',
        ((SELECT COUNT(id) FROM user_feedback WHERE severity = 2 and ${templateSql} ))  AS '高等'
        from user_feedback where ${templateSql}
        ;
        `;
        return originSQL;
    }

    async proportionOfCustomerComplaintsSQL(templateSql: string): Promise<any> {
        const originSQL = `
        select
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 1 and ${templateSql} )) AS '用戶帳號相關',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 2 and ${templateSql} )) AS '聊天室檢舉',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 3 and ${templateSql} ))  AS '預訂相關',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 4 and ${templateSql} ))  AS '會員儲值相關',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 5 and ${templateSql} ))  AS '服務商款項相關',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 6 and ${templateSql} ))  AS '平台相關',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 7 and ${templateSql} ))  AS '行程突發事件',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 8 and ${templateSql} ))  AS '即刻快閃相關',
        ((SELECT COUNT(id) FROM user_feedback WHERE type = 99 and ${templateSql} ))  AS '其他分類'
        from user_feedback where ${templateSql}
        ;
        `;
        return originSQL;
    }

    async bookingCancellationTrendSQL(moreAndLess, templateSql: string): Promise<any> {
        // DATE_FORMAT(started_At,'%Y-%m') t
        const active_cancellation = `
            SELECT count(JSON_EXTRACT(details, "$.refusedNote")) AS value,  ${moreAndLess} as t
            FROM datings 
            WHERE 
            JSON_EXTRACT(details, "$.refusedNote") != '服務商逾時未回覆' and 
            status = -1 and  
            ${templateSql}
                Group by ${moreAndLess}
                Order by ${moreAndLess} asc;
            `;
        const passive_cancellation = `
            SELECT count(JSON_EXTRACT(details, "$.refusedNote")) AS value, ${moreAndLess} as t
            FROM datings 
            WHERE 
            JSON_EXTRACT(details, "$.refusedNote") = '服務商逾時未回覆' and 
            status = -1 and  
            ${templateSql}
                Group by ${moreAndLess}
                Order by ${moreAndLess} asc;
            `;
        const member_cancel = `
            SELECT count(id) AS value,   ${moreAndLess} as t
            FROM datings 
            WHERE 
            status = -2 and  
            ${templateSql}
                Group by ${moreAndLess}
                Order by ${moreAndLess} asc;
            `;
        const member_temporary_cancel = `
            SELECT count(id) AS value,   ${moreAndLess} as t 
            FROM datings 
            WHERE 
            status = -3 and  
            ${templateSql}
                Group by ${moreAndLess}
                Order by ${moreAndLess} asc;
            `;

        return {
            active_cancellation,
            passive_cancellation,
            member_cancel,
            member_temporary_cancel,
        };
    }

    async popular(params: any): Promise<any> {
        const week0 = [];
        const week1 = [];
        const week2 = [];
        const week3 = [];
        const week4 = [];
        const week5 = [];

        params.map((e) => {
            switch (moment(e.t).add(-8, "hours").hours()) {
                case 2:
                case 3:
                case 4:
                case 5:
                    week0.push(e);
                    break;
                case 6:
                case 7:
                case 8:
                case 9:
                    week1.push(e);
                    break;
                case 10:
                case 11:
                case 12:
                case 13:
                    week2.push(e);
                    break;
                case 14:
                case 15:
                case 16:
                case 17:
                    week3.push(e);
                    break;
                case 18:
                case 19:
                case 20:
                case 21:
                    week4.push(e);
                    break;
                case 22:
                case 23:
                case 0:
                case 1:
                    week5.push(e);
                    break;
                default:
                    break;
            }
        });

        function weekCa(params: any): any {
            const week_0 = [];
            const week_1 = [];
            const week_2 = [];
            const week_3 = [];
            const week_4 = [];
            const week_5 = [];
            const week_6 = [];
            params.forEach((i) => {
                switch (moment(i.t).day()) {
                    case 0:
                        week_0.push(i);
                        break;
                    case 1:
                        week_1.push(i);
                        break;
                    case 2:
                        week_2.push(i);
                        break;
                    case 3:
                        week_3.push(i);
                        break;
                    case 4:
                        week_4.push(i);
                        break;
                    case 5:
                        week_5.push(i);
                        break;
                    case 6:
                        week_6.push(i);
                        break;
                    default:
                        break;
                }
            });
            const result = [week_1.length, week_2.length, week_3.length, week_4.length, week_5.length, week_6.length, week_0.length];
            return result;
        }

        const final_result = [
            {
                name: "02 - 06",
                data: weekCa(week0),
            },
            {
                name: "06 - 10",
                data: weekCa(week1),
            },
            {
                name: "10 - 14",
                data: weekCa(week2),
            },
            {
                name: "14 - 18",
                data: weekCa(week3),
            },
            {
                name: "18 - 22",
                data: weekCa(week4),
            },
            {
                name: "22 - 02",
                data: weekCa(week5),
            },
        ];

        return final_result;
    }
}
