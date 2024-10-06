import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import moment from "moment";
import { NonBusinessHours } from "src/business/non-business-hours/non-business-hours.entity";
import { WeeklyBusinessHours } from "src/business/weekly-business-hours/weekly-business-hours.entity";
import { omit as _omit } from "lodash/object";
import { Order } from "../order.entity";
import { DatingDemandEnrollers } from "src/demands/dating-demands-enrollers/dating-demands-enrollers.entity";
import { flattenDeep as _flattenDeep } from "lodash/array";
import { scale36, getRandom } from "src/global/helper.service";
import { TransactionLogsType } from "src/transaction-logs/enums/transaction-logs.enum";
import { User } from "src/users/user.entity";
@Injectable()
export class OrderHelperService {
    protected price: number;
    protected usePayVoucher: boolean;
    protected duration: number;
    protected tip: number;
    public total: number;
    protected discount: number;
    constructor(
        private data: { price?: number; usePayVoucher?: boolean; duration?: number; tip?: number; discount?: number },
        private readonly configService: ConfigService
    ) {
        this.price = data.price;
        this.usePayVoucher = data.usePayVoucher;
        this.duration = data.duration;
        this.tip = data.tip;
        // 訂單總額
        this.total = this.datingPriceCount({ price: data.price, duration: data.duration, tip: data.tip });
    }

    /**
     * 新增 orderId
     * @param { type Number(數字)} unixtime unixtime 時間
     * 首碼 u 是使用者, 儲值是 s, 預約單是 d 開頭
     */
    async createOrderId(type: string, unixtime: number): Promise<string> {
        const r1 = getRandom(0, 9);
        const r2 = getRandom(0, 9);
        const r3 = getRandom(0, 9);
        const key = await scale36(unixtime);
        return `${type}${key}${r1}${r2}${r3}`;
    }

    /**
     * 計算訂單總額
     * @param { type Object(物件) } data
     * @example {
     *  price: 1000 (每小時單價)
     *  duration: 2 (預訂時數)
     *  tip: 100 (小費)
     * }
     */
    public datingPriceCount(data: { price: number; duration: number; tip: number }) {
        return data.price * data.duration + data.tip;
    }

    /**
     * 計算折抵金
     */
    public discountCount() {
        const voucherMaxDiscount = this.configService.get("order.voucherMaxDiscount");
        // 判斷不使用折抵金
        if (!this.usePayVoucher) {
            return 0;
        }
        // 判斷訂單金額大於 1000 時 才能使用折抵金
        if (this.total >= 1000) {
            const discount = Math.floor(this.total / 1000);
            const result = discount * 100 > this.discount ? this.discount : discount * 100;
            // 判斷折抵金額大於 1000 時 最高只能折抵 1000 因此回傳 1000
            if (result > voucherMaxDiscount) {
                return voucherMaxDiscount;
            } else {
                return result;
            }
        }
        return 0;
    }

    /**
     * 平台服務費
     */
    public feeCount() {
        return Math.ceil(this.total * this.configService.get("order.panelFeeCommisionRate"));
    }

    /**
     * 應付總額
     */
    public amountsPayable() {
        return this.total + this.feeCount() - this.discountCount();
    }

    /**
     * 服務商收益
     */
    public providerIncome() {
        // return Math.floor(this.total - this.total * 0.3);
        return Math.floor(this.total * this.configService.get("order.providerCommisionRate"));
    }

    /**
     * 創建可預訂時間
     * @param { type Number(數字) } minHours 每項活動分類最少預訂時數（單位小時）
     * @param { type Number(數字) } datingAfterHours  預訂單緩衝時數（單位小時）
     * @param { type Boolean(布林值) } isCurrentReceiver 判斷是否為當下預訂單行程中對象
     */
    public createCanBookingTimes(data: { minHours: number; datingAfterHours: number; isCurrentReceiver: boolean }) {
        // 可預訂日期
        const dates = {};
        // 可預訂時長
        const durations = [];
        // 可預訂時辰
        const hours = {};
        // 當天可預訂時辰（因為當天有可能已經不知道幾點了 所以可預訂時辰不可能是 24小時)
        const currentHours = {};
        // 已可預訂最少時數開始選擇預訂時辰 最多不超過 24 小時
        for (let i = data.minHours; i < 24; i++) {
            durations.push(i);
        }
        // 首天可預訂時辰 以當下時辰 往前加一小時 為可預訂最開始時辰
        for (let i = moment().hours() + 1; i < 24; i++) {
            if (i < 10) {
                currentHours[`0${i}:00`] = durations;
            } else {
                currentHours[`${i}:00`] = durations;
            }
        }
        // 將 24 小時統計成時間 key
        for (let i = 0; i < 24; i++) {
            if (i < 10) {
                hours[`0${i}:00`] = durations;
            } else {
                hours[`${i}:00`] = durations;
            }
        }
        // 加上緩衝時間後 可預訂的日期跟當前日期差幾天
        let canBookingDate = 0;
        // 判斷是否為當下預訂單行程中對象時 不需加上緩衝時間
        if (!data.isCurrentReceiver) {
            canBookingDate = moment().add(data.datingAfterHours, "hours").dates() - moment().dates();
        }
        // 計算加上緩衝時間後 可預訂時間日期 往後推 小於 30 天
        for (let i = canBookingDate; i < 31; i++) {
            const day = moment().add(i, "days").format("YYYY-MM-DD");
            /**
             * 最開始可預訂日期 為 今日可預訂時辰
             * ex: 當今時辰 22:00 時 可預訂時辰為 23:00 之後
             */
            if (i === canBookingDate) {
                dates[day] = currentHours;
            } else {
                // 剩餘日期為 0~23 小時之間皆可預訂
                dates[day] = hours;
            }
            // 當前沒有可預訂時段時 不顯示此日期
            if (Object.keys(dates[day]).length === 0) {
                // 刪除此日期 key
                delete dates[day];
            }
        }
        return dates;
    }

    /**
     * 過濾行事曆與當週關閉營業時間
     * 使用到 lodash 方法整理資料
     * https://lodash.com/docs/4.17.15#omit
     * @param { type Object(物件) } data 需求資料
     * @param dates 可預訂日期與時間
     * @param nonWeeklyBusinessHours 每週非營業時間
     * @param businessHours 行事曆開啟營業時間
     */
    public filterNonBusinessHours(data: { dates: object; nonWeeklyBusinessHours: WeeklyBusinessHours[]; businessHours: NonBusinessHours[] }) {
        const dates = data.dates;
        // 將可預訂時間做整理
        Object.keys(dates).forEach((key) => {
            // 返回行事曆日期 與 可預訂日期相等的日期資料已取得開啟中的營業時間
            const filterBusinessHours = data.businessHours
                .filter((businessHour) => {
                    return moment.utc(businessHour.schedule).format("YYYY-MM-DD") === key;
                })
                .map((item2) => {
                    return { date: moment.utc(item2.schedule).format("YYYY-MM-DD"), hour: moment.utc(item2.schedule).hours() };
                });
            // 過濾掉關閉的 每週營業時間關閉時段 且 行事曆營業時間也是關閉的
            data.nonWeeklyBusinessHours.forEach((item) => {
                const hour = item.close < 10 ? `0${item.close}:00` : `${item.close}:00`;
                /**
                 * 判斷 每週營業時段 與 當下可預訂日期 相符
                 * 且 行事曆中與每週營業的營業時段同為關閉中 時 移除可預訂時段的 key
                 */
                if (item.weekday === moment.utc(key).weekday() && filterBusinessHours.find((i) => i.hour === item.close) === undefined) {
                    dates[key] = _omit(dates[key], [hour]);
                }
            });
            // 可預訂時段
            let times: any = Object.keys(dates[key]).map((key2) => {
                if (parseInt(key2.slice(0, 2)) < 10) {
                    return parseInt(key2.slice(1, 2));
                }
                return parseInt(key2.slice(0, 2));
            });
            times = times.filter((item) => {
                // 過濾掉 行事曆營業時段 取出非 行事曆營業時段
                return (
                    // 判斷與目前回圈在跑的日期相同 且 非行事曆營業時段時間
                    filterBusinessHours.find((item2) => item2.date === key) !== undefined &&
                    !filterBusinessHours.map((item2) => item2.hour).includes(item)
                );
            });
            const timeFormat = times.map((item) => (item < 10 ? `0${item}:00` : `${item}:00`));
            // 移除不可預訂時段
            dates[key] = _omit(dates[key], timeFormat);
        });
        return dates;
    }

    /**
     * 過濾掉預訂單行程 與 即刻快閃已報名的行程 如果是同一會員 則不過濾
     * 使用到 lodash 方法整理資料
     * https://lodash.com/docs/4.17.15#omit
     * @param { type Object(物件) } data 需求資料
     * @param memberId 會員 id
     * @param datingAfterHours: 每張單間隔時數
     * @param dates 可預訂日期與時間
     * @param orders 預訂單資料
     * @param datingDemandEnrollers 即刻快閃報名資料
     */
    public filterBookingSchedule(data: {
        memberId: number;
        datingAfterHours: number;
        dates: object;
        orders: Order[];
        datingDemandEnrollers: DatingDemandEnrollers[];
    }) {
        const dates = data.dates;
        /**
         * 將 已預訂時段 整理出來 整理成日期與預訂時辰區間
         * @return [
         *  { date: '2023-01-17', hour: 4, userId: 6047 },
         *  { date: '2023-01-17', hour: 5, userId: 6047 },
         *  { date: '2023-01-17', hour: 6, userId: 6047 },
         *  { date: '2023-01-18', hour: 5, userId: 6073 },
         *  { date: '2023-01-18', hour: 6, userId: 6073 },
         *  { date: '2023-01-18', hour: 7, userId: 6073 }
         * ]
         * 使用到 lodash 方法整理資料
         * https://lodash.com/docs/4.17.15#flattenDeep (將多維陣列 整理成 1維陣列)
         */
        const filterOrders = _flattenDeep(
            data.orders.map((item) => {
                let range = moment.duration(moment.utc(item.ended_at).diff(moment.utc(item.started_at))).asHours() - 1;
                // 判斷預訂會員非同一會員時 需加上服務商設定的每筆訂單間隔時數
                if (item.user_id !== data.memberId) {
                    range += data.datingAfterHours;
                }
                const hourDates = [];
                for (let i = 0; i <= range; i++) {
                    const time = moment.utc(item.started_at).add(i, "hours");
                    hourDates.push({ date: time.format("YYYY-MM-DD"), hour: time.hours(), userId: item.user_id });
                }
                return hourDates;
            })
        );
        /**
         * 將即刻快閃 已報名時段 整理出來 整理成日期與預訂時辰區間
         * @return[
         *  { date: '2023-01-19', hour: 0, userId: 6047 },
         *  { date: '2023-01-19', hour: 1, userId: 6047 },
         *  { date: '2023-01-16', hour: 1, userId: 6073 },
         *  { date: '2023-01-16', hour: 2, userId: 6073 },
         *  { date: '2023-01-16', hour: 3, userId: 6073 }
         * ]
         * 使用到 lodash 方法整理資料
         * https://lodash.com/docs/4.17.15#flattenDeep (將多維陣列 整理成 1維陣列)
         */
        const filterDatingDemandEnrollers = _flattenDeep(
            data.datingDemandEnrollers.map((item) => {
                let range = moment.duration(moment.utc(item.dating_demands.ended_at).diff(moment.utc(item.dating_demands.started_at))).asHours() - 1;
                // 判斷預訂會員非同一會員時 需加上服務商設定的每筆訂單間隔時數
                if (item.dating_demands.user_id !== data.memberId) {
                    range += data.datingAfterHours;
                }
                const hourDates = [];
                for (let i = 0; i <= range; i++) {
                    const time = moment.utc(item.dating_demands.started_at).add(i, "hours");
                    hourDates.push({ date: time.format("YYYY-MM-DD"), hour: time.hours(), userId: item.dating_demands.user_id });
                }
                return hourDates;
            })
        );
        // 將可預訂時間做整理
        Object.keys(dates).forEach((key) => {
            /**
             * 過濾掉 預訂單時間
             * 使用到 lodash 方法整理資料
             * https://lodash.com/docs/4.17.15#omit (移除物件中 指定 key 方法)
             */
            filterOrders.forEach((item) => {
                if (item.date === key) {
                    const hour = item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`;
                    dates[key] = _omit(dates[key], [hour]);
                }
            });
            /**
             * 過濾掉 已報名的即刻快閃單 時間
             * 使用到 lodash 方法整理資料
             * https://lodash.com/docs/4.17.15#omit (移除物件中 指定 key 方法)
             */
            filterDatingDemandEnrollers.forEach((item) => {
                if (item.date === key) {
                    const hour = item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`;
                    dates[key] = _omit(dates[key], [hour]);
                }
            });
            // 當前沒有可預訂時段時 不顯示此日期
            if (Object.keys(dates[key]).length === 0) {
                // 刪除此日期 key
                delete dates[key];
            }
        });
        return dates;
    }

    /**
     * 過濾掉 不符合最少可預訂時數的時辰
     * 且 為每個預訂時段加入 最長可預訂時常
     * @param { type Object(物件) } data 需求資料
     * @param dates 可預訂日期與時間
     * @param minHours 每項活動分類最少預訂時數（單位小時）
     */
    public filterByMinHours(data: { dates: object; minHours: number }) {
        const dates = data.dates;
        const lastDay = moment.utc().add(31, "days").format("YYYY-MM-DD");
        Object.keys(dates).forEach(async (key) => {
            // 將可預訂時轉成整數存成陣列
            const times: any = Object.keys(dates[key]).map((key2) => {
                if (parseInt(key2.slice(0, 2)) < 10) {
                    return parseInt(key2.slice(1, 2));
                }
                return parseInt(key2.slice(0, 2));
            });
            // 可預訂時段
            const canBookingHours = [];
            // 可預訂時段往後 + 1 看是否存在於 當日可預訂時段中
            times.forEach((item, index, arr) => {
                const n = item + 1;
                const time = times.find((time) => time === n);
                if (time !== undefined) {
                    canBookingHours.push(time);
                }
            });
            // 不可預約時段
            const filterHours = [];
            // 取得隔日時間
            const tomorrow = moment.utc(key).add(1, "days").format("YYYY-MM-DD");
            // 可預訂時段
            let tomorrowTimes = [];
            // 判斷是否有存在於可預訂日期 key
            if (dates[tomorrow] !== undefined) {
                /**
                 * 因為是需要計算隔日可預訂時常
                 * 因此需將每個預訂時段加上 24 小時
                 */
                tomorrowTimes = Object.keys(dates[tomorrow]).map((key2) => {
                    if (parseInt(key2.slice(0, 2)) < 10) {
                        return parseInt(key2.slice(1, 2)) + 24;
                    }
                    return parseInt(key2.slice(0, 2)) + 24;
                });
            }
            /**
             * 將今日與隔日可預訂時段陣列合併
             */
            const totalTimes = canBookingHours.concat(tomorrowTimes);
            /**
             * 計算每小時最多可預訂時長
             */

            if (key !== lastDay) {
                Object.keys(dates[key]).forEach((key2) => {
                    // 當前預訂時段轉換成 整數 ex: 01:00 = 1 or 10:00 = 10
                    const currentHour = parseInt(key2.slice(0, 2)) < 10 ? parseInt(key2.slice(1, 2)) : parseInt(key2.slice(0, 2));
                    // 當前預訂時段轉換成 整數 ex: 01:00 = 1 or 10:00 = 10
                    let hour = parseInt(key2.slice(0, 2)) < 10 ? parseInt(key2.slice(1, 2)) : parseInt(key2.slice(0, 2));
                    // 每個時段可預訂時常
                    let durations = [];
                    totalTimes.forEach((item, index, arr) => {
                        // 判斷可預訂時段 比對 當前時段 + 1 時 是否有值存在
                        if (item === hour + 1) {
                            // 更改當前時段值 因為要比對 可預訂時段時間
                            hour = item;
                            // 當可預訂時長小於 24 小時 才加入（因為規則是每張單最長可預訂時常為 24小時)
                            if (item - currentHour <= 24) {
                                // 將比對後的可預訂時段 扣除當下預訂時段 也就是為可選擇時段可預約 時常
                                durations.push(item - currentHour);
                            }
                        }
                    });
                    // 過濾掉可預訂時常 小於 每項活動分類 最小預訂時數值 ex: 假設最少預訂 3 小時
                    durations = durations.filter((item) => item >= data.minHours);

                    // 當可預訂時常為 0 時 須移除可預訂時段 ex: 移除 01:00 時段
                    if (durations.length === 0) {
                        filterHours.push(key2);
                    }
                    // 耕改預訂時段可預約時常
                    dates[key][key2] = durations;
                });
            }
            // 移除沒有 可以預訂時常的時段 ex: 01:00 沒有可預訂時常時 須移除此時段
            dates[key] = _omit(dates[key], filterHours);
            // 當前沒有可預訂時段時 不顯示此日期
            if (Object.keys(dates[key]).length === 0) {
                // 刪除此日期 key
                delete dates[key];
            }
        });
        return dates;
    }

    /**
     * 聊天室訂單訊息
     * @param { type Obejct } data 需求資料
     * @key type: 訊息類別
     * @key orderData: 訂單資料
     * @key memberData: 會員資料
     * @key providerData: 服務商資料
     * @key userId: 會員的 banana_id
     */
    public async sendChatMessageData(data: { type: string; orderData: Order; memberData: User; providerData: User; userId: string }) {
        switch (data.type) {
            case TransactionLogsType.CREATE_ORDER:
                const sendData = {
                    createdAt: moment().valueOf(),
                    district: data.orderData.district,
                    startedAt: moment(data.orderData.started_at).format("YYYY-MM-DD HH:mm:ss"),
                    endedAt: moment(data.orderData.ended_at).format("YYYY-MM-DD HH:mm:ss"),
                    location: data.orderData.location,
                    price: data.orderData.price,
                    type: "createDating",
                    userId: data.userId,
                    orderId: data.orderData.order_id,
                };
                const title = "已發起預訂，內容如下：";
                return { title, sendData };
        }
    }

    /**
     * 簡訊內容
     * @param { type Obejct } data 需求資料
     * @key type: 訊息類別
     * @key orderData: 訂單資料
     * @key memberData: 會員資料
     * @key providerData: 服務商資料
     */
    public async sendSmsData(data: { type: string; orderData: Order; memberData: User; providerData: User }) {
        switch (data.type) {
            case TransactionLogsType.CREATE_ORDER:
                moment.locale("zh-tw");
                const startDateTime = moment(data.orderData.started_at).format("MM月DD日[（]dd[）]HH:mm");
                const sendData = `
                    已收到「${data.memberData.name}」發起在${startDateTime}的預訂，點擊查看訂單 ${this.configService.get("host.clientHost")}'
                `;
                return sendData;
        }
    }
}
