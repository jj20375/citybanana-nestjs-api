import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ChatRealtimeHelperService } from "src/firebase/chats/chat-realtime/chat-realtime-helper/chat-realtime-helper.service";
import { UsersRepository } from "src/users/users.repository";
import { OrderRepository } from "./order.repository";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { User } from "src/users/user.entity";
import { OrderHelperService } from "./order-helper/order-helper.service";
import { Order } from "./order.entity";
import { IorderDetails } from "src/order/order.interface";
import moment from "moment";
import { OrderStatusConfig } from "./enums/order.enum";
import { VouchersRepository } from "src/vouchers/vouchers.repository";
import { VoucherLogsRepository } from "src/voucher-logs/voucher-logs.repository";
import { PlatformLogsRepository } from "src/platform-logs/platform-logs.repository";
import { VoucherLogsTypeConfig } from "src/voucher-logs/enums/voucher-logs.enum";
import { sum as _sum } from "lodash/math";
import { Transaction } from "sequelize";
import { TransactionLogsRepository } from "src/transaction-logs/transaction-logs.repository";
import { TransactionLogsType } from "src/transaction-logs/enums/transaction-logs.enum";
import { TelegramService } from "src/telegram/telegram.service";
import { NotificationService } from "src/notification/notification.service";
import { ChatFirestoreService } from "src/firebase/chats/chat-firestore/chat-firestore.service";
import { PlatformLogsService } from "src/platform-logs/platform-logs.service";
import { MitakeSmsService } from "src/sms/mitake-sms/mitake-sms.service";
@Injectable()
export class OrderService {
    private algorithm: string;
    private iv: string;
    private key: string;
    private creditCardKey: string;
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly chatRealtimeHelper: ChatRealtimeHelperService,
        private readonly chatFirestoreService: ChatFirestoreService,
        private readonly usersRepository: UsersRepository,
        private readonly http: HttpService,
        private readonly configService: ConfigService,
        private readonly vouchersRepository: VouchersRepository,
        private readonly voucherLogsRepository: VoucherLogsRepository,
        private readonly platformLogsRepository: PlatformLogsRepository,
        private readonly platformLogsService: PlatformLogsService,
        private readonly transactionLogsRepository: TransactionLogsRepository,
        private readonly telegramService: TelegramService,
        private readonly notificationService: NotificationService,
        private readonly mitakeSmsService: MitakeSmsService
    ) {
        this.algorithm = "aes-256-cbc";
        this.iv = process.env.NEWEBPAY_HASH_IV;
        this.key = process.env.NEWEBPAY_HASH_KEY;
        this.creditCardKey = process.env.CREDIT_CARD_SECRET;
    }

    /**
     * 創建訂單
     * @param data
     * @returns
     */
    async create(
        data: {
            provider_id: string | number;
            memberData: User;
            category_id: number;
            duration: number;
            date: string;
            time: string;
            pay_voucher: boolean;
            tip?: number;
            description?: string;
            district: string;
            location: string;
            ip: string;
        },
        transaction: Transaction
    ): Promise<Order | any> {
        /**
         * 取得服務商資料
         */
        data.provider_id = data.provider_id.toString();
        let provider: any = { id: null };
        if (data.provider_id.match(/^\d+/g) !== null) {
            provider = await this.usersRepository.findOneByProviderMoreQuery({ query: { id: parseInt(data.provider_id) } });
        } else {
            provider = await this.usersRepository.findOneByProviderMoreQuery({ query: { banana_id: data.provider_id } });
        }
        if (provider === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "找不到服務商",
                    error: {
                        error: 4001,
                        msg: "找不到服務商",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }

        /**
         * 判斷是否封鎖對方或被對方封鎖
         */
        let isBlacklisted = false;
        const blacklistedByProvider = provider["blacklist_userIds"].find((user) => user.black_id === data.memberData.id);
        const blacklistedByMember = provider["blacklist_blackIds"].find((user) => user.user_id === data.memberData.id);
        if (blacklistedByProvider !== undefined || blacklistedByMember !== undefined) {
            isBlacklisted = true;
        }
        if (isBlacklisted) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    msg: "被封鎖",
                    error: {
                        error: 5018,
                        msg: "被封鎖",
                    },
                },
                HttpStatus.FORBIDDEN
            );
        }
        /**
         * 判斷選擇分類有無開啟
         */
        const category = provider["category_user"].find((item) => {
            return item.category_id === data.category_id && item.status === 0;
        });
        if (category === undefined) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "服務分類未開啟",
                    error: {
                        error: 5001,
                        msg: "服務分類未開啟",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }

        /**
         * 計算訂單金額與預訂時間方法
         */
        const orderHelperService = new OrderHelperService(
            {
                price: category.price,
                duration: data.duration,
                usePayVoucher: data.pay_voucher,
                tip: data.tip ?? 0,
                discount: data.memberData.wallet ? (data.memberData.wallet.voucher ? data.memberData.wallet.voucher : 0) : 0,
            },
            this.configService
        );
        let balance = 0;
        /**
         * 判斷錢包是否足夠錢支付訂單
         */
        if (data.memberData.hasOwnProperty("wallet")) {
            balance = data.memberData.wallet.balance;
            // 錢包不夠錢情況
            if (balance < orderHelperService.amountsPayable()) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.PAYMENT_REQUIRED,
                        msg: "餘額不足",
                        error: {
                            error: 5004,
                            msg: "餘額不足",
                        },
                    },
                    HttpStatus.PAYMENT_REQUIRED
                );
            }
        }
        // 錢包餘額為 0 時 回傳錯誤
        if (balance <= 0) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.PAYMENT_REQUIRED,
                    msg: "餘額不足",
                    error: {
                        error: 5004,
                        msg: "餘額不足",
                    },
                },
                HttpStatus.PAYMENT_REQUIRED
            );
        }
        // 判斷是否有設定緩衝時間 沒設定情況下採用預設值
        const datingAfterHours = provider.setting.datingAfterHours ?? this.configService.get("order.availableDatingAfterHours");
        // 判斷是否有同一個會員的預訂單
        const isHaveCurrentReceiverDating = provider.receiver_orders.length > 0 && provider.dating_demand_enrollers.length > 0 ? true : false;
        // 創建 30 天可預訂日期資料
        let times = orderHelperService.createCanBookingTimes({
            minHours: category.min_dating_unit,
            datingAfterHours: datingAfterHours,
            isCurrentReceiver: isHaveCurrentReceiverDating,
        });
        // 過濾每週營業時間與行事曆營業時間
        times = orderHelperService.filterNonBusinessHours({
            dates: times,
            nonWeeklyBusinessHours: provider.weekly_business_hours,
            businessHours: provider.non_business_hours.filter((item) => item.open === 1),
        });
        // 過濾掉重疊時間
        times = orderHelperService.filterBookingSchedule({
            memberId: data.memberData.id,
            datingAfterHours: datingAfterHours,
            dates: times,
            orders: provider.receiver_orders,
            datingDemandEnrollers: provider.dating_demand_enrollers,
        });
        // 可預訂時常整理
        times = orderHelperService.filterByMinHours({ dates: times, minHours: category.min_dating_unit });
        if (times[data.date][data.time] === undefined) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "非可預訂日期或時段",
                    error: {
                        error: 5002,
                        msg: "非可預訂日期或時段",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        } else {
            if (!times[data.date][data.time].includes(data.duration)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "非可預訂時數",
                        error: {
                            error: 5003,
                            msg: "非可預訂時數",
                        },
                    },
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        const orderId = await orderHelperService.createOrderId("d", moment().valueOf());

        const details: IorderDetails = {
            serviceCharge: category.price * data.duration,
            hourlyPrice: category.price,
            duration: data.duration,
            tip: data.tip ?? 0,
            fee: orderHelperService.feeCount(),
            providerRemuneration: orderHelperService.providerIncome(),
            price: orderHelperService.total,
            total: orderHelperService.total + orderHelperService.feeCount(),
        };
        const order = await this.orderRepository.create(
            {
                order_id: orderId,
                user_id: data.memberData.id,
                provider_id: parseInt(data.provider_id),
                category_id: category.category_id,
                started_at: moment(`${data.date} ${data.time}`).format("YYYY-MM-DD HH:mm"),
                ended_at: moment(`${data.date} ${data.time}`).add(data.duration, "hours").format("YYYY-MM-DD HH:mm"),
                description: data.description ?? null,
                district: data.district,
                location: data.location,
                price: category.price,
                gross_price: category.price * data.duration,
                paid: orderHelperService.amountsPayable(),
                provider_remuneration: orderHelperService.providerIncome(),
                details,
                status: OrderStatusConfig.STAT_WAITING,
            },
            transaction
        );
        // 新增 platformlog
        await this.platformLogsRepository.setCreateOrderLog(
            {
                level: this.platformLogsService.LEVEL_INFO,
                type: this.platformLogsService.TYPE_DATINGS,
                action: this.platformLogsService.ACTION_CREATE,
                user_id: data.memberData.id,
                administrator_id: null,
                address: {
                    REMOTE_ADDR: data.ip,
                    HTTP_X_FORWARDED_FOR: data.ip,
                },
                target_type: "datings",
                target_id: order.id,
                payload: order,
            },
            transaction
        );
        // 更新帳戶餘額
        await this.updateUserBalance(
            {
                userId: data.memberData.id,
                userBanana_id: data.memberData.banana_id,
                wallet: data.memberData.wallet,
                amountsPayable: orderHelperService.amountsPayable(),
                date: data.date,
                details,
                orderData: order,
                datingId: order.id,
            },
            transaction
        );
        // 判斷是否有使用折抵金
        if (data.pay_voucher) {
            // 計算折抵金餘額 並寫入折抵金 log
            await this.useDiscount({ userId: data.memberData.id, usePoint: 2000, memberData: data.memberData, orderId: orderId }, transaction);
        }

        // 開單成功後 發小鈴鐺通知 與 FCM 告知服務商
        await this.sendNotification(
            {
                userId: provider.banana_id,
                mark: "d_01",
                details: {
                    user: data.memberData,
                    details: order,
                    provider: provider,
                    time: new Date(),
                    order_id: order.order_id,
                },
            },
            transaction
        );
        // 開單成功後 發訊息至聊天室
        await this.sendChatMessage(
            {
                memberData: data.memberData,
                providerData: provider,
                orderData: order,
            },
            orderHelperService,
            transaction
        );
        // 開單成功後 發簡訊到服務商手機
        await this.sendSms(
            {
                memberData: data.memberData,
                providerData: provider,
                orderData: order,
            },
            orderHelperService,
            transaction
        );
        // 交易流程結束後才觸發
        transaction.afterCommit(async () => {
            // 發送 telegram 訊息
            await this.telegramService.isCreateOrder({
                userName: data.memberData.name,
                providerName: provider.name,
                dateStarted: moment.utc(`${data.date} ${data.time}`).format("YYYY-MM-DD HH:mm"),
                dateEnded: moment.utc(`${data.date} ${data.time}`).add(data.duration, "hours").format("YYYY-MM-DD HH:mm"),
                district: data.district,
                location: data.location,
                description: data.description ?? "",
            });
        });
        return order;

        // return { provider, isBlacklisted, category, balance, total: orderHelperService.amountsPayable(), times };
        // return { provider, times };
        // return { times };
    }

    /**
     * 計算折抵金
     * @param userId 使用者 id
     * @param usePoint 使用折抵金額度
     */
    async useDiscount(data: { userId: number; usePoint: number; memberData: User; orderId: string }, transaction: Transaction): Promise<void> {
        let datas: any = await this.vouchersRepository.findUnExpiredAndEffective(data);
        let usePoint = data.usePoint;
        datas = datas.map((item) => ({ id: item.id, amount: item.amount, used: item.used }));
        // 計算折抵金剩餘額度
        datas = datas.map((item) => {
            // 判斷全部額度 減去 使用額度 後 大於或等於 必須花費折抵金額度 且折抵金額度 大於 0 時
            if (item.amount - item.used >= usePoint && usePoint > 0) {
                // 折抵金抵銷額度
                item.usePoint = usePoint;
                // 折抵金使用額度 (需花費折抵金 + 已花費折抵金)
                item.used = usePoint + item.used;
                /**
                 * 剩餘需花費的折抵金額度
                 * 因為有可能 一張折抵金餘額單 不能夠抵用 需花費的折抵金額度
                 * 因此需扣除已抵用額度 剩餘額度 用於另一張折抵金單 折抵
                 */
                usePoint = item.amount - item.used;
            } else if (usePoint > 0) {
                /**
                 * 當剩餘需折抵的額度大於 0 時 (剩餘需折抵額度 - 折抵金單可用餘額)
                 * 為當下目前剩餘折抵單可折抵額度
                 */
                usePoint = usePoint - (item.amount - item.used);
                item.usePoint = item.amount - item.used;
                item.used = item.used + usePoint > item.amount ? item.amount : item.used + usePoint;
            }
            return item;
        });
        // 剩餘折抵金總額度
        const count = _sum(datas.map((item) => item.amount - item.used));
        // 更新 user voucher
        await this.usersRepository.updateUserBalance(
            {
                userId: data.memberData.id,
                wallet: {
                    ...data.memberData.wallet,
                    voucher: count,
                },
            },
            transaction
        );
        for (let i = 0; i < datas.length; i++) {
            // 更新折抵金額度
            await this.vouchersRepository.updateAmountAdnUsedColumn(
                {
                    amount: datas[i].amount,
                    used: datas[i].used,
                    id: datas[i].id,
                },
                transaction
            );
            // 寫入折抵金紀錄
            await this.voucherLogsRepository.create(
                {
                    voucher_id: datas[i].id,
                    type: VoucherLogsTypeConfig.DROP_POINT,
                    amount: datas[i].usePoint,
                    details: {
                        type: "dating",
                        order_id: data.orderId,
                    },
                    balance: datas[i].amount - datas[i].used,
                },
                transaction
            );
        }
    }

    /**
     * 更新使用者餘額
     * 包含防火牆科技餘額
     *
     */
    async updateUserBalance(
        data: {
            userId: number;
            userBanana_id: string;
            wallet: any;
            amountsPayable: number;
            date: string;
            details: object;
            datingId: number;
            orderData: Order;
        },
        transaction: Transaction
    ) {
        // 更新會員剩餘點數額度
        await this.usersRepository.updateUserBalance(
            {
                userId: data.userId,
                wallet: {
                    ...data.wallet,
                    balance: data.wallet.balance - data.amountsPayable,
                },
            },
            transaction
        );
        // 取得防火牆科技資料
        const bank = await this.usersRepository.findOne({ column: "id", value: 1 });
        // 更新防火牆科技點數額度
        await this.usersRepository.updateUserBalance(
            {
                userId: bank.id,
                wallet: {
                    ...bank.wallet,
                    balance: bank.wallet.balance + data.amountsPayable,
                },
            },
            transaction
        );

        // 新增會員扣款 log
        await this.transactionLogsRepository.create(
            {
                user_id: data.userId,
                type: TransactionLogsType.CREATE_ORDER,
                vested_on: data.date,
                details: { ...data.details, datingId: data.datingId },
                amount: -data.amountsPayable,
                balance: data.wallet.balance - data.amountsPayable,
            },
            transaction
        );
        // 新增防火牆帳戶交易 log
        await this.transactionLogsRepository.create(
            {
                user_id: bank.id,
                type: TransactionLogsType.CREATE_ORDER,
                vested_on: data.date,
                details: { ...data.details, datingId: data.datingId },
                amount: data.amountsPayable,
                balance: bank.wallet.balance + data.amountsPayable,
            },
            transaction
        );
        // 當交易結束後 發送扣款 小鈴鐺通知 與 FCM 告知會員扣款成功
        transaction.afterCommit(async () => {
            await this.sendNotification(
                {
                    userId: data.userBanana_id,
                    mark: "p_02",
                    details: {
                        time: new Date(),
                        details: data.orderData,
                        gross_price: data.amountsPayable,
                        order_id: data.orderData.order_id,
                    },
                },
                transaction
            );
        });
    }

    /**
     * 發送通知訊息
     */
    async sendNotification(
        data: {
            userId: string;
            mark: string;
            details: {
                time: Date;
                user?: {
                    name: string;
                    [key: string]: any;
                };
                provider?: {
                    name: string;
                    [key: string]: any;
                };
                datingExtension?: {
                    gross_price: number;
                    [key: string]: any;
                };
                gross_price?: number;
                difference?: number;
                refund?: number;
                amount?: number;
                paid?: number;
                tip?: number;
                demand?: {
                    name: string;
                    demand_id: number;
                    [key: string]: any;
                };
                details: {
                    order_id: string;
                    [key: string]: any;
                };
                order_id: string;
            };
        },
        transaction: Transaction
    ): Promise<void> {
        transaction.afterCommit(async () => {
            await this.notificationService.addNotificationData({
                userId: data.userId,
                addData: { mark: data.mark, data: data.details },
            });
        });
    }

    /**
     * 發送聊天室訊息
     */
    async sendChatMessage(
        data: { memberData: User; providerData: User; orderData: Order },
        orderHelperService: OrderHelperService,
        transaction: Transaction
    ): Promise<void> {
        transaction.afterCommit(async () => {
            const { title, sendData } = await orderHelperService.sendChatMessageData({
                type: TransactionLogsType.CREATE_ORDER,
                orderData: data.orderData,
                memberData: data.memberData,
                providerData: data.providerData,
                userId: data.memberData.banana_id,
            });
            await this.chatRealtimeHelper.sendMessage(sendData, data.memberData.banana_id, data.providerData.banana_id);
            await this.chatRealtimeHelper.sendMessage(sendData, data.providerData.banana_id, data.memberData.banana_id);
            await this.chatFirestoreService.setUnreadCountAndLastMessage({
                loginUserId: data.memberData.banana_id,
                receiveUserId: data.providerData.banana_id,
                message: title,
                isProvider: false,
            });
        });
    }

    /**
     * 判斷是否發送簡訊
     */
    async sendSms(
        data: { memberData: User; providerData: User; orderData: Order },
        orderHelperService: OrderHelperService,
        transaction: Transaction
    ): Promise<void> {
        transaction.afterCommit(async () => {
            // 判斷是 dev 環境時 不發送簡訊
            if (process.env.NODE_ENV === "development") {
                return;
            }
            if (data.providerData.hasOwnProperty("setting")) {
                if (data.providerData.setting.receiveDatingCreatedSMS === 1) {
                    // 取得發送簡訊內容
                    const message = await orderHelperService.sendSmsData({
                        type: TransactionLogsType.CREATE_ORDER,
                        orderData: data.orderData,
                        memberData: data.memberData,
                        providerData: data.providerData,
                    });
                    await this.mitakeSmsService.sendSms({
                        dstaddr: data.providerData.phone,
                        destname: data.providerData.name,
                        smbody: message,
                    });
                    return;
                }
            }
            return;
        });
    }

    /**
     * 可預訂時間
     */
    async availableTimes(data: { category_id: number; provider_id: string; member_id: string }) {
        let provider: any = { id: null };
        if (data.provider_id.match(/^\d+/g) !== null) {
            provider = await this.usersRepository.findOneByProviderMoreQuery({ query: { id: parseInt(data.provider_id) } });
        } else {
            provider = await this.usersRepository.findOneByProviderMoreQuery({ query: { banana_id: data.provider_id } });
        }

        if (provider === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "找不到服務商",
                    error: {
                        error: 4001,
                        msg: "找不到服務商",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        // 判斷是否有設定緩衝時間 沒設定情況下採用預設值
        const datingAfterHours = provider.setting.datingAfterHours ?? this.configService.get("order.availableDatingAfterHours");
        // 判斷是否有同一個會員的預訂單
        const isHaveCurrentReceiverDating = provider.receiver_orders.length > 0 && provider.dating_demand_enrollers.length > 0 ? true : false;

        /**
         * 計算訂單金額與預訂時間方法
         */
        const orderHelperService = new OrderHelperService({}, this.configService);
        /**
         * 判斷選擇分類有無開啟
         */
        const category = provider["category_user"].find((item) => {
            return item.category_id === data.category_id && item.status === 0;
        });
        if (category === undefined) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "服務分類未開啟",
                    error: {
                        error: 5018,
                        msg: "服務分類未開啟",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        // 創建 30 天可預訂日期資料
        let times = orderHelperService.createCanBookingTimes({
            minHours: category.min_dating_unit,
            datingAfterHours: datingAfterHours,
            isCurrentReceiver: isHaveCurrentReceiverDating,
        });
        // 過濾每週營業時間與行事曆營業時間
        times = orderHelperService.filterNonBusinessHours({
            dates: times,
            nonWeeklyBusinessHours: provider.weekly_business_hours,
            businessHours: provider.non_business_hours.filter((item) => item.open === 1),
        });
        // 過濾掉重疊時間
        times = orderHelperService.filterBookingSchedule({
            memberId: parseInt(data.member_id),
            datingAfterHours: datingAfterHours,
            dates: times,
            orders: provider.receiver_orders,
            datingDemandEnrollers: provider.dating_demand_enrollers,
        });
        // 可預訂時常整理
        times = orderHelperService.filterByMinHours({ dates: times, minHours: category.min_dating_unit });
        return times;
    }
}
