import { HttpException, HttpStatus, Injectable, Inject } from "@nestjs/common";
import crypto from "crypto";
import { CreditCard } from "src/credit-card/credit-card.entity";
import { Payments } from "src/payments/payments.entity";
import { TransactionLogs } from "src/transaction-logs/transaction-logs.entity";
import { User } from "src/users/user.entity";
import { NewebpayService } from "src/payments/newebpay/newebpay.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import moment from "moment";
import { AxiosError } from "axios";
import { RedisClient } from "@nestjs/microservices/external/redis.interface";
import { createClient } from "redis";
import { JwtService } from "@nestjs/jwt";
import { PlatformLogs } from "src/platform-logs/platform-logs.entity";
import { UsersHelperService } from "../users/users-helper.service";
import { NotificationService } from "../notification/notification.service";
import { TelegramService } from "src/telegram/telegram.service";

@Injectable()
export class CreditCardService {
    private phpAPI: string;

    @Inject(NewebpayService)
    private readonly newebpayService: NewebpayService;
    private algorithm: string;
    private creditCardKey: string;

    private redisHost: string;
    private redisPort: number;
    public redisClient: RedisClient;

    constructor(
        @Inject("CREDITCARD_REPOSITORY")
        private creditCardRepository: typeof CreditCard,
        @Inject("PAYMENTS_REPOSITORY")
        private paymentsRepository: typeof Payments,
        @Inject("PLATFORMLOGS_REPOSITORY")
        private platformLogsRepository: typeof PlatformLogs,
        @Inject("TRANSACTIONLOGS_REPOSITORY")
        private transactionLogsRepository: typeof TransactionLogs,
        @Inject("USERS_REPOSITORY")
        private usersRepository: typeof User,
        private readonly usersHelper: UsersHelperService,
        private readonly configService: ConfigService,
        private http: HttpService,
        private readonly jwtService: JwtService,
        private notificationsService: NotificationService,
        private readonly telegramService: TelegramService
    ) {
        this.redisHost = this.configService.get("redis.redis_host");
        this.redisPort = this.configService.get("redis.redis_port");
        this.redisClient = createClient({
            url: `redis://${this.redisHost}:${this.redisPort}`,
        });
        this.phpAPI = this.configService.get("host.phpAPI");
        this.phpAPI = this.configService.get("host.phpAPI");
        this.algorithm = "aes-256-cbc";
        this.creditCardKey = process.env.CREDIT_CARD_SECRET;
    }
    /**
     * 信用卡加密方式
     * @param data
     * @returns
     */
    async encryptByCreditCard(data: any) {
        const IV_LENGTH = 16;
        const iv = crypto.randomBytes(IV_LENGTH);
        // 加密規則 ase-256-cbc
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.creditCardKey), iv);
        let encrypted = cipher.update(data.value);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        // console.log(`未加密前：${data.value}`);
        // console.log("加密结果: ", iv.toString("hex") + ":" + encrypted.toString("hex"));
        return iv.toString("hex") + ":" + encrypted.toString("hex");
    }

    /**
     * 信用卡解密方式
     * @param data
     * @returns
     */
    async decryptByCreditCard(data: any) {
        const textParts = data.value.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encryptedText = Buffer.from(textParts.join(":"), "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(this.creditCardKey), iv);
        let decrypted = decipher.update(encryptedText);

        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    }

    async notify(data, req: any) {
        try {
            console.log("notify, 藍新回傳");
            console.log(data);
            const result = JSON.parse(data.Result);
            const inputPaymentData = Object.assign({}, data);
            inputPaymentData.Result = {};
            const redisResult = await (await this.redis()).getRedisData(result.MerchantOrderNo);
            const redisInfo = JSON.parse(redisResult.toString());

            console.log("notify, redis");
            console.log(redisInfo);

            let transactionLogJson;
            if (data.Status === "SUCCESS") {
                console.log("SUCCESS");
                // Check payments
                const payments = await this.paymentsRepository.findOne<Payments>({
                    where: {
                        order_id: result.MerchantOrderNo,
                    },
                });

                console.log("notify, 查詢payment透過order_id取得status");
                console.log(payments["dataValues"].status);

                // 查詢錢包餘額
                const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
                const balance = await this.usersRepository.findOne<User>({
                    where: {
                        id: redisInfo.userId,
                    },
                    attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
                });
                const originBalance = balance["dataValues"].balance;
                const finalAmount = parseInt(result.Amt) + parseInt(originBalance);
                // Update user wallet
                const userModel = await this.usersRepository.findOne({ where: { id: redisInfo.userId } });
                userModel.set({ "wallet.balance": finalAmount });
                await userModel.save();

                console.log("notify, 更新wallet.balance為", finalAmount);

                const userJSON = userModel.toJSON();
                // transaction_logs
                const transaction = {
                    user_id: redisInfo.userId,
                    vested_on: moment().format("YYYY-MM-DD"),
                    type: "TOP_UP",
                    details: { Result: result },
                    amount: result.Amt,
                    balance: finalAmount,
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    balance_id: null,
                    broker_id: null,
                    commission: "0",
                };
                const transactionLog = await this.addTransactionLogs(transaction);

                console.log("notify, 更新transactionLogs");
                console.log(transaction);

                transactionLogJson = transactionLog.toJSON();
                // update payment data for success
                await this.paymentsRepository.sequelize.query(
                    `update payments set details=JSON_MERGE_PATCH('${JSON.stringify(inputPaymentData)}', '{"Result": ${JSON.stringify(
                        result
                    )}}'), type='CREDIT', pay_time='${moment().format("YYYY-MM-DD HH:mm:ss")}',transaction_log_id="${
                        transactionLogJson.id
                    }", status=1, updated_at='${moment().format("YYYY-MM-DD HH:mm:ss")}' where order_id='${result.MerchantOrderNo}'`
                );
                // await this.paymentsRepository.update<Payments>(
                //     {
                //         status: 1,
                //         transaction_log_id: transactionLogJson.id,
                //         details: { Result: result },
                //         pay_time: Date.now(),
                //         type: "CREDIT",
                //         updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                //     },
                //     { where: { order_id: result.MerchantOrderNo } }
                // );
                // tg to devChat
                const telData = {
                    userName: userJSON.name,
                    amount: result.Amt,
                };
                await this.telegramService.contactTOPUP(telData);

                // 寫入系統日誌 儲值
                const platformlog = {
                    level: "info",
                    type: "balance",
                    action: "top up",
                    user_id: redisInfo.userId,
                    administrator_id: null,
                    address: req.ip,
                    target_type: "users",
                    target_id: redisInfo.userId,
                    payload: {
                        amount: result.Amt,
                        userId: redisInfo.userId,
                        Result: data,
                        db: redisInfo,
                    },
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                };
                await this.addPlatformLogs(platformlog);

                console.log("notify, 更新platformlog");
                console.log(platformlog);

                if (redisInfo.is_Order === true) {
                    await this.order(redisInfo, redisInfo.authorization);
                }
                if (redisInfo.is_Demand === true) {
                    await this.demand(redisInfo, redisInfo.authorization, result.MerchantOrderNo);
                    console.log("notify, Call laravel即刻快閃預定單");
                    console.log(redisInfo);
                } else {
                    // TODO: 請款API
                    const newebpayPayloadCLose = {
                        RespondType: "JSON",
                        Version: process.env.NEWEBPAY_VERSION,
                        Amt: data.Amt,
                        MerchantOrderNo:
                            data.MerchantOrderNo === undefined
                                ? await this.usersHelper.createBananaId("s", moment().valueOf())
                                : data.MerchantOrderNo,
                        TimeStamp: moment().valueOf(),
                        IndexType: 1,
                        TradeNo: result.MerchantOrderNo,
                        CloseType: 1,
                    };
                    const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                    const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                    console.log("runPaycloseresult");
                    console.log(runPaycloseresult.data);
                }

                const addData = {
                    mark: "p_26", // = 標記(mark)
                    data: platformlog,
                };
                await this.notificationsService.addNotificationData({ userId: redisInfo.bananaId, addData });
            } else {
                console.log("FAIL");

                const platformlog = {
                    level: "error",
                    type: "balance",
                    action: "top up",
                    user_id: redisInfo.userId,
                    administrator_id: null,
                    address: req.ip,
                    target_type: "users",
                    target_id: redisInfo.userId,
                    payload: {
                        amount: result.Amt,
                        userId: redisInfo.userId,
                        Result: data,
                        db: redisInfo,
                    },
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                };
                const addData = {
                    mark: "p_25", // = 標記(mark)
                    data: platformlog,
                };
                await this.notificationsService.addNotificationData({ userId: redisInfo.bananaId, addData });
                // 寫入系統日誌 notify 失敗
                await this.addPlatformLogs(platformlog);

                // update payment data for fail
                await this.paymentsRepository.sequelize.query(
                    `update payments set details=JSON_MERGE_PATCH('${JSON.stringify(inputPaymentData)}', '{"Result": ${JSON.stringify(
                        result
                    )}}'), type='CREDIT', pay_time='${moment().format("YYYY-MM-DD HH:mm:ss")}', status=-1, updated_at='${moment().format(
                        "YYYY-MM-DD HH:mm:ss"
                    )}' where order_id='${result.MerchantOrderNo}'`
                );
                // await this.paymentsRepository.update(
                //     {
                //         status: 1,
                //         transaction_log_id: null,
                //         details: { Result: result },
                //         pay_time: Date.now(),
                //         type: "CREDIT",
                //         updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                //     },
                //     { where: { order_id: result.MerchantOrderNo } }
                // );
            }
            return data;
        } catch (error) {
            console.log("catch");
            console.log(error);
            console.log(error.message);
            return "";
            // throw new HttpException(
            //     {
            //         statusCode: HttpStatus.BAD_REQUEST,
            //         msg: "支付預約費用並新增信用卡失敗",
            //         error: {
            //             error: "n12001",
            //             msg: error.message,
            //         },
            //     },
            //     HttpStatus.BAD_REQUEST
            // );
        }
    }

    async getCreditCards(authorization: any) {
        const { userId } = await this.getUserIdAndToken(authorization);

        const data = await this.creditCardRepository.findAll<CreditCard>({
            where: {
                user_id: userId,
            },
            attributes: ["id", "number", "expiration", "cardholder", "issuer", "comment", "is_default", "cvc"],
        });

        return Promise.all(
            data.map(async (e) => {
                const decryptResult = await this.decryptByCreditCard({ value: e.number });
                return {
                    id: e.id,
                    // 取信用卡後四碼
                    number: "****" + decryptResult.substring(decryptResult.length - 4, decryptResult.length),
                    expiration: e.expiration,
                    cvc: e.cvc,
                    cardholder: e.cardholder,
                    issuer: e.issuer,
                    comment: e.comment,
                    is_default: e.is_default === 1 ? true : false,
                    status: e.status,
                };
            })
        );
    }

    async advanceCreateCreditCardPay(authorization, data, req: any) {
        const { userId, token } = await this.getUserIdAndToken(authorization);

        try {
            // 判斷 全額 或 差價 isFullAmount
            // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/providers/show.md
            // 取得供應商活動價錢
            const providerHeadersRequest = {
                authorization: authorization,
            };
            let providerRes;
            try {
                providerRes = await this.http.get(`${this.phpAPI}/providers/${data.provider_id}`, { headers: providerHeadersRequest }).toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }

            let hourly_price;
            providerRes.data.normal_categories.forEach((element) => {
                if (data.category_id == element.pivot.category_id) {
                    hourly_price = element.pivot.price;
                }
            });

            // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/my/estimate-dating.md
            // 1. 預約哪個服務商的哪個分類的服務
            // 2. 預約幾小時
            // 3. 小費多少
            // 4. 有沒有使用折抵金
            // 取得估算金額
            const estimateHeadersRequest = {
                authorization: authorization,
                Accept: "aplication/json",
            };
            let estimateRes;
            try {
                estimateRes = await this.http
                    .get(
                        `${this.phpAPI}/my/dating-estimations?hourly_price=${hourly_price}&duration=${data.duration}${
                            data.tip === undefined ? "" : "&tip=" + data.tip
                        }&pay_voucher=${data.pay_voucher}`,
                        { headers: estimateHeadersRequest }
                    )
                    .toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }
            let amount = estimateRes.data.shouldPay;

            // 查詢錢包餘額
            const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
            const balance = await this.usersRepository.findOne<User>({
                where: {
                    id: userId,
                },
                attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
            });
            const originBalance = balance["dataValues"].balance;

            // check P3D
            Object.assign(data, { is_Order: true });
            data = await this.checkP3D(data, userId, token, req.userData.banana_id, req.userData.status);

            let result;
            // 判斷是否全額刷卡
            if (!data.is_fullAmount) {
                // 沒有要全額刷卡
                // 刷卡金額
                amount = parseInt(estimateRes.data.shouldPay) - parseInt(originBalance);

                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 判斷是否要信用卡儲值
                if (amount > 0) {
                    // 藍新站內付款
                    const newebpayPayload = {
                        P3D: data.P3D,
                        amount: amount,
                        CardNo: data.number,
                        Exp: data.expiration,
                        CVC: data.cvc,
                        userId: userId,
                        NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                        MerchantOrderNo: data.MerchantOrderNo,
                        typeReturnUrl: 2,
                    };
                    const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                    result = await this.newebpayService.runPay(resultEncrypt.encrypted);
                    // 判斷刷卡是否成功
                    if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                        // Update user wallet
                        const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                        userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                        await userModel.save();

                        // transaction_logs
                        const transaction = {
                            user_id: userId,
                            vested_on: moment().format("YYYY-MM-DD"),
                            type: "TOP_UP",
                            details: { Result: result.data },
                            amount: amount,
                            balance: parseInt(estimateRes.data.shouldPay) + parseInt(originBalance),
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            balance_id: null,
                            broker_id: null,
                            commission: "0",
                        };
                        await this.addTransactionLogs(transaction);

                        // 寫入系統日誌 儲值
                        const platformlog = {
                            level: "info",
                            type: "balance",
                            action: "top up",
                            user_id: userId,
                            administrator_id: null,
                            address: { REMOTE_ADDR: req.ip },
                            target_type: "users",
                            target_id: userId,
                            payload: {
                                amount: amount,
                                userId: userId,
                            },
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        };
                        await this.addPlatformLogs(platformlog);
                        // 建立預約單 API
                        await this.order(data, authorization);
                        // return Object.assign(resultNewebpay.data, { SMessage: "支付預約費用差額刷卡完成並建立預約單" });

                        // TODO: 請款API
                        const newebpayPayloadCLose = {
                            RespondType: "JSON",
                            Version: process.env.NEWEBPAY_VERSION,
                            Amt: amount,
                            MerchantOrderNo:
                                data.MerchantOrderNo === undefined
                                    ? await this.usersHelper.createBananaId("s", moment().valueOf())
                                    : data.MerchantOrderNo,
                            TimeStamp: moment().valueOf(),
                            IndexType: 1,
                            TradeNo: data.MerchantOrderNo,
                            CloseType: 1,
                        };
                        const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                        const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                        console.log("runPaycloseresult");
                        console.log(runPaycloseresult.data);
                        console.log("支付預約費用差額刷卡完成並建立預約單");
                    } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                        console.log("成功取得3D HTML");
                        return result.data;
                    } else {
                        throw new AxiosError(JSON.stringify(result.data));
                    }
                } else {
                    await this.order(data, authorization);
                    console.log("支付預約費用差額刷卡完成並建立預約單");
                    // return Object.assign({}, { SMessage: "支付預約費用差額刷卡完成並建立預約單" });
                }
            } else {
                // 全額刷卡
                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 藍新站內付款
                const newebpayPayload = {
                    P3D: data.P3D,
                    amount: amount,
                    CardNo: data.number,
                    Exp: data.expiration,
                    CVC: data.cvc,
                    userId: userId,
                    NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                    MerchantOrderNo: data.MerchantOrderNo,
                    typeReturnUrl: 2,
                };
                const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                result = await this.newebpayService.runPay(resultEncrypt.encrypted);

                if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                    // Update user wallet
                    const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                    userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                    await userModel.save();

                    // transaction_logs
                    const transaction = {
                        user_id: userId,
                        vested_on: moment().format("YYYY-MM-DD"),
                        type: "TOP_UP",
                        details: { Result: result.data },
                        amount: amount,
                        balance: parseInt(estimateRes.data.shouldPay) + parseInt(originBalance),
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        balance_id: null,
                        broker_id: null,
                        commission: "0",
                    };
                    await this.addTransactionLogs(transaction);

                    // 寫入系統日誌 儲值
                    const platformlog = {
                        level: "info",
                        type: "balance",
                        action: "top up",
                        user_id: userId,
                        administrator_id: null,
                        address: { REMOTE_ADDR: req.ip },
                        target_type: "users",
                        target_id: userId,
                        payload: {
                            amount: amount,
                            userId: userId,
                        },
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    };
                    await this.addPlatformLogs(platformlog);
                    // 建立預約單 API
                    await this.order(data, authorization);

                    // TODO: 請款API
                    const newebpayPayloadCLose = {
                        RespondType: "JSON",
                        Version: process.env.NEWEBPAY_VERSION,
                        Amt: amount,
                        MerchantOrderNo:
                            data.MerchantOrderNo === undefined
                                ? await this.usersHelper.createBananaId("s", moment().valueOf())
                                : data.MerchantOrderNo,
                        TimeStamp: moment().valueOf(),
                        IndexType: 1,
                        TradeNo: data.MerchantOrderNo,
                        CloseType: 1,
                    };
                    const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                    const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                    console.log("runPaycloseresult");
                    console.log(runPaycloseresult.data);
                } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                    console.log("成功取得3D HTML");
                    // return result.data;
                } else {
                    throw new AxiosError(JSON.stringify(result.data));
                }
            }

            return await this.isSave(result, data, userId, amount);
        } catch (error) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "支付預約費用並新增信用卡失敗",
                    error: {
                        error: "n12001",
                        msg: error.message,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async advanceCreateCreditCardByCreditCardID(authorization: any, data: any, creditCardID: string, req: any) {
        const { userId, token } = await this.getUserIdAndToken(authorization);
        try {
            // 判斷 全額 或 差價 isFullAmount
            // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/providers/show.md
            // 取得供應商活動價錢
            const providerHeadersRequest = {
                authorization: authorization,
            };
            let providerRes;
            try {
                providerRes = await this.http.get(`${this.phpAPI}/providers/${data.provider_id}`, { headers: providerHeadersRequest }).toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }

            let hourly_price;
            providerRes.data.normal_categories.forEach((element) => {
                if (data.category_id == element.pivot.category_id) {
                    hourly_price = element.pivot.price;
                }
            });

            // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/my/estimate-dating.md
            // 1. 預約哪個服務商的哪個分類的服務
            // 2. 預約幾小時
            // 3. 小費多少
            // 4. 有沒有使用折抵金
            // 取得估算金額
            const estimateHeadersRequest = {
                authorization: authorization,
                Accept: "aplication/json",
            };
            let estimateRes;
            try {
                estimateRes = await this.http
                    .get(
                        `${this.phpAPI}/my/dating-estimations?hourly_price=${hourly_price}&duration=${data.duration}${
                            data.tip === undefined ? "" : "&tip=" + data.tip
                        }&pay_voucher=${data.pay_voucher}`,
                        { headers: estimateHeadersRequest }
                    )
                    .toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }
            let amount = estimateRes.data.shouldPay;
            // 取得信用卡
            const creditCardResult = await this.creditCardRepository.findOne<CreditCard>({
                where: {
                    user_id: userId,
                    id: creditCardID,
                },
                attributes: ["id", "number", "expiration", "cvc", "cardholder", "issuer", "comment", "is_default", "status"],
            });
            if (creditCardResult === null) {
                throw new Error("此信用卡不存在");
            }

            const decryptResult = await this.decryptByCreditCard({ value: creditCardResult.number });

            // 查詢錢包餘額
            const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
            const balance = await this.usersRepository.findOne<User>({
                where: {
                    id: userId,
                },
                attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
            });
            const originBalance = balance["dataValues"].balance;

            // check P3D
            Object.assign(data, { is_Order: true });
            data = await this.checkP3D(data, userId, token, req.userData.banana_id, req.userData.status);

            // 判斷是否要全額刷卡儲值
            if (!data.is_fullAmount) {
                // 部分刷卡金額
                amount = parseInt(estimateRes.data.shouldPay) - parseInt(originBalance);

                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 判斷前是否足夠 須繳-餘額 > 0 => 不足
                if (amount > 0) {
                    // 藍新站內付款
                    const newebpayPayload = {
                        P3D: data.P3D,
                        amount: amount,
                        CardNo: decryptResult,
                        Exp: creditCardResult.expiration,
                        CVC: creditCardResult.cvc,
                        userId: userId,
                        NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                        MerchantOrderNo: data.MerchantOrderNo,
                        typeReturnUrl: 2,
                    };
                    const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                    const result = await this.newebpayService.runPay(resultEncrypt.encrypted);
                    if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                        // Update user wallet
                        const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                        userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                        await userModel.save();

                        // transaction_logs
                        const transaction = {
                            user_id: userId,
                            vested_on: moment().format("YYYY-MM-DD"),
                            type: "TOP_UP",
                            details: { Result: result.data },
                            amount: amount,
                            balance: parseInt(amount) + parseInt(originBalance),
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            balance_id: null,
                            broker_id: null,
                            commission: "0",
                        };
                        await this.addTransactionLogs(transaction);

                        // 寫入系統日誌 儲值
                        const platformlog = {
                            level: "info",
                            type: "balance",
                            action: "top up",
                            user_id: userId,
                            administrator_id: null,
                            address: { REMOTE_ADDR: req.ip },
                            target_type: "users",
                            target_id: userId,
                            payload: {
                                amount: amount,
                                userId: userId,
                            },
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        };
                        await this.addPlatformLogs(platformlog);
                        // 建立預約單 API
                        await this.order(data, authorization);

                        // TODO: 請款API
                        const newebpayPayloadCLose = {
                            RespondType: "JSON",
                            Version: process.env.NEWEBPAY_VERSION,
                            Amt: amount,
                            MerchantOrderNo:
                                data.MerchantOrderNo === undefined
                                    ? await this.usersHelper.createBananaId("s", moment().valueOf())
                                    : data.MerchantOrderNo,
                            TimeStamp: moment().valueOf(),
                            IndexType: 1,
                            TradeNo: data.MerchantOrderNo,
                            CloseType: 1,
                        };
                        const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                        const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                        console.log("runPaycloseresult");
                        console.log(runPaycloseresult.data);
                        return Object.assign(result.data, { SMessage: "支付預約費用差額刷卡完成並建立預約單" });
                    } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                        console.log("成功取得3D HTML");
                        return result.data;
                    } else {
                        throw new AxiosError(JSON.stringify(result.data));
                    }
                } else {
                    await this.order(data, authorization);
                    return Object.assign({}, { SMessage: "餘額足夠並建立預約單" });
                }
            } else {
                // 全額刷卡
                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 藍新站內付款
                const newebpayPayload = {
                    P3D: data.P3D,
                    amount: amount,
                    CardNo: decryptResult,
                    Exp: creditCardResult.expiration,
                    CVC: creditCardResult.cvc,
                    userId: userId,
                    NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                    MerchantOrderNo: data.MerchantOrderNo,
                    typeReturnUrl: 2,
                };
                const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                const result = await this.newebpayService.runPay(resultEncrypt.encrypted);

                if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                    // Update user wallet
                    const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                    userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                    await userModel.save();
                    // transaction_logs
                    const transaction = {
                        user_id: userId,
                        vested_on: moment().format("YYYY-MM-DD"),
                        type: "TOP_UP",
                        details: { Result: result.data },
                        amount: amount,
                        balance: parseInt(amount) + parseInt(originBalance),
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        balance_id: null,
                        broker_id: null,
                        commission: "0",
                    };
                    await this.addTransactionLogs(transaction);
                    // 寫入系統日誌 儲值
                    const platformlog = {
                        level: "info",
                        type: "balance",
                        action: "top up",
                        user_id: userId,
                        administrator_id: null,
                        address: { REMOTE_ADDR: req.ip },
                        target_type: "users",
                        target_id: userId,
                        payload: {
                            amount: amount,
                            userId: userId,
                        },
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    };
                    await this.addPlatformLogs(platformlog);
                    // 建立預約單 API
                    await this.order(data, authorization);

                    // TODO: 請款API
                    const newebpayPayloadCLose = {
                        RespondType: "JSON",
                        Version: process.env.NEWEBPAY_VERSION,
                        Amt: amount,
                        MerchantOrderNo:
                            data.MerchantOrderNo === undefined
                                ? await this.usersHelper.createBananaId("s", moment().valueOf())
                                : data.MerchantOrderNo,
                        TimeStamp: moment().valueOf(),
                        IndexType: 1,
                        TradeNo: data.MerchantOrderNo,
                        CloseType: 1,
                    };
                    const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                    const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                    console.log("runPaycloseresult");
                    console.log(runPaycloseresult.data);
                    return Object.assign(result.data, { SMessage: "支付預約費用完成並建立預約單" });
                } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                    console.log("成功取得3D HTML");
                    return result.data;
                } else {
                    throw new AxiosError(JSON.stringify(result.data));
                }
            }
        } catch (error) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "以指定已儲存信用卡預約費用失敗",
                    error: {
                        error: "n12002",
                        msg: error.message,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async demandsCreateCreditCardPay(authorization, data, req: any) {
        const { userId, token } = await this.getUserIdAndToken(authorization);

        try {
            // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/my/estimate-dating.md
            // 1. 預約哪個服務商的哪個分類的服務
            // 2. 預約幾小時
            // 3. 小費多少
            // 4. 有沒有使用折抵金
            // 取得估算金額
            const estimateHeadersRequest = {
                authorization: authorization,
                Accept: "aplication/json",
            };
            let estimateRes;
            try {
                estimateRes = await this.http
                    .get(
                        `${this.phpAPI}/my/dating-estimations?unit=${data.unit}&hourly_price=${data.hourly_pay}&duration=${
                            data.duration
                        }&provider_count=${data.provider_required}${data.tip === undefined ? "" : "&tip=" + data.tip}${
                            data.pay_voucher === undefined ? "" : "&pay_voucher=" + data.pay_voucher
                        }`,
                        { headers: estimateHeadersRequest }
                    )
                    .toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }
            let amount = estimateRes.data.shouldPay;
            // 查詢錢包餘額
            const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
            const balance = await this.usersRepository.findOne<User>({
                where: {
                    id: userId,
                },
                attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
            });
            const originBalance = balance["dataValues"].balance;

            // check P3D
            Object.assign(data, { is_Demand: true });
            data = await this.checkP3D(data, userId, token, req.userData.banana_id, req.userData.status);

            let result;
            // 判斷是否全額刷卡
            if (!data.is_fullAmount) {
                // 沒有要全額刷卡
                // 刷卡金額
                amount = parseInt(estimateRes.data.shouldPay) - parseInt(originBalance);
                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 判斷是否要信用卡儲值
                if (amount > 0) {
                    // 藍新站內付款
                    const newebpayPayload = {
                        P3D: data.P3D,
                        amount: amount,
                        CardNo: data.number,
                        Exp: data.expiration,
                        CVC: data.cvc,
                        userId: userId,
                        NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                        MerchantOrderNo: data.MerchantOrderNo,
                        typeReturnUrl: 3,
                    };
                    const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                    result = await this.newebpayService.runPay(resultEncrypt.encrypted);
                    // 判斷刷卡是否成功
                    if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                        // Update user wallet
                        const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                        userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                        await userModel.save();
                        // transaction_logs
                        const transaction = {
                            user_id: userId,
                            vested_on: moment().format("YYYY-MM-DD"),
                            type: "TOP_UP",
                            details: { Result: result.data },
                            amount: amount,
                            balance: parseInt(amount) + parseInt(originBalance),
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            balance_id: null,
                            broker_id: null,
                            commission: "0",
                        };
                        await this.addTransactionLogs(transaction);
                        // 寫入系統日誌 儲值
                        const platformlog = {
                            level: "info",
                            type: "balance",
                            action: "top up",
                            user_id: userId,
                            administrator_id: null,
                            address: { REMOTE_ADDR: req.ip },
                            target_type: "users",
                            target_id: userId,
                            payload: {
                                amount: amount,
                                userId: userId,
                            },
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        };
                        await this.addPlatformLogs(platformlog);
                        // 建立預約單 API
                        await this.demand(data, authorization, data.MerchantOrderNo);
                        // return Object.assign(resultNewebpay.data, { SMessage: "支付預約費用差額刷卡完成並建立預約單" });
                        console.log("支付預約費用差額刷卡完成並建立即可快閃");
                    } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                        console.log("成功取得3D HTML");
                        return result.data;
                    } else {
                        throw new AxiosError(JSON.stringify(result.data));
                    }
                } else {
                    await this.demand(data, authorization, data.MerchantOrderNo);
                    console.log("支付預約費用差額刷卡完成並建立即可快閃");
                    // return Object.assign({}, { SMessage: "支付預約費用差額刷卡完成並建立即可快閃" });
                }
            } else {
                // 全額刷卡
                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 藍新站內付款
                const newebpayPayload = {
                    P3D: data.P3D,
                    amount: amount,
                    CardNo: data.number,
                    Exp: data.expiration,
                    CVC: data.cvc,
                    userId: userId,
                    NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                    MerchantOrderNo: data.MerchantOrderNo,
                    typeReturnUrl: 3,
                };
                const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                result = await this.newebpayService.runPay(resultEncrypt.encrypted);

                if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                    // Update user wallet
                    const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                    userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                    await userModel.save();
                    // transaction_logs
                    const transaction = {
                        user_id: userId,
                        vested_on: moment().format("YYYY-MM-DD"),
                        type: "TOP_UP",
                        details: { Result: result.data },
                        amount: amount,
                        balance: parseInt(amount) + parseInt(originBalance),
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        balance_id: null,
                        broker_id: null,
                        commission: "0",
                    };
                    await this.addTransactionLogs(transaction);
                    // 寫入系統日誌 儲值
                    const platformlog = {
                        level: "info",
                        type: "balance",
                        action: "top up",
                        user_id: userId,
                        administrator_id: null,
                        address: { REMOTE_ADDR: req.ip },
                        target_type: "users",
                        target_id: userId,
                        payload: {
                            amount: amount,
                            userId: userId,
                        },
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    };
                    await this.addPlatformLogs(platformlog);
                    // 建立預約單 API
                    await this.demand(data, authorization, data.MerchantOrderNo);
                } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                    console.log("成功取得3D HTML");
                    // return result.data;
                } else {
                    throw new AxiosError(JSON.stringify(result.data));
                }
            }

            return await this.isSave(result, data, userId, amount);
        } catch (error) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "支付即可快閃費用並新增信用卡失敗",
                    error: {
                        error: "n12003",
                        msg: error.message,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async demandsCreateCreditCardByCreditCardID(authorization: any, data: any, creditCardID: string, req: any) {
        const { userId, token } = await this.getUserIdAndToken(authorization);
        try {
            // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/my/estimate-dating.md
            // 1. 預約哪個服務商的哪個分類的服務
            // 2. 預約幾小時
            // 3. 小費多少
            // 4. 有沒有使用折抵金
            // 取得估算金額
            const estimateHeadersRequest = {
                authorization: authorization,
                Accept: "aplication/json",
            };
            let estimateRes;
            try {
                estimateRes = await this.http
                    .get(
                        `${this.phpAPI}/my/dating-estimations?unit=${data.unit}&hourly_price=${data.hourly_pay}&duration=${
                            data.duration
                        }&provider_count=${data.provider_required}${data.tip === undefined ? "" : "&tip=" + data.tip}${
                            data.pay_voucher === undefined ? "" : "&pay_voucher=" + data.pay_voucher
                        }`,
                        { headers: estimateHeadersRequest }
                    )
                    .toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }
            let amount = estimateRes.data.shouldPay;
            // 取得信用卡
            const creditCardResult = await this.creditCardRepository.findOne<CreditCard>({
                where: {
                    user_id: userId,
                    id: creditCardID,
                },
                attributes: ["id", "number", "expiration", "cvc", "cardholder", "issuer", "comment", "is_default", "status"],
            });
            if (creditCardResult === null) {
                throw new Error("此信用卡不存在");
            }

            const decryptResult = await this.decryptByCreditCard({ value: creditCardResult.number });

            // 查詢錢包餘額
            const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
            const balance = await this.usersRepository.findOne<User>({
                where: {
                    id: userId,
                },
                attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
            });
            const originBalance = balance["dataValues"].balance;

            // check P3D
            Object.assign(data, { is_Demand: true });
            data = await this.checkP3D(data, userId, token, req.userData.banana_id, req.userData.status);

            // 判斷是否要全額刷卡儲值
            if (!data.is_fullAmount) {
                // 部分刷卡金額
                amount = parseInt(estimateRes.data.shouldPay) - parseInt(originBalance);

                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                // 判斷前是否足夠 須繳-餘額 > 0 => 不足
                if (amount > 0) {
                    // 藍新站內付款
                    const newebpayPayload = {
                        P3D: data.P3D,
                        amount: amount,
                        CardNo: decryptResult,
                        Exp: creditCardResult.expiration,
                        CVC: creditCardResult.cvc,
                        userId: userId,
                        NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                        MerchantOrderNo: data.MerchantOrderNo,
                        typeReturnUrl: 3,
                    };
                    const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                    const result = await this.newebpayService.runPay(resultEncrypt.encrypted);
                    if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                        // Update user wallet
                        const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                        userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                        await userModel.save();
                        // transaction_logs
                        const transaction = {
                            user_id: userId,
                            vested_on: moment().format("YYYY-MM-DD"),
                            type: "TOP_UP",
                            details: { Result: result.data },
                            amount: amount,
                            balance: parseInt(amount) + parseInt(originBalance),
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            balance_id: null,
                            broker_id: null,
                            commission: "0",
                        };
                        await this.addTransactionLogs(transaction);
                        // 寫入系統日誌 儲值
                        const platformlog = {
                            level: "info",
                            type: "balance",
                            action: "top up",
                            user_id: userId,
                            administrator_id: null,
                            address: { REMOTE_ADDR: req.ip },
                            target_type: "users",
                            target_id: userId,
                            payload: {
                                amount: amount,
                                userId: userId,
                            },
                            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        };
                        await this.addPlatformLogs(platformlog);
                        // 建立預約單 API
                        await this.demand(data, authorization, data.MerchantOrderNo);
                        return Object.assign(result.data, { SMessage: "支付預約費用差額刷卡完成並建立即可快閃" });
                    } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                        console.log("成功取得3D HTML");
                        return result.data;
                    } else {
                        throw new AxiosError(JSON.stringify(result.data));
                    }
                } else {
                    await this.demand(data, authorization, data.MerchantOrderNo);
                    return Object.assign({}, { SMessage: "餘額足夠並建立即可快閃" });
                }
            } else {
                // 全額刷卡
                // payment
                await this.paymentsRepository.create<Payments>({
                    reason: "Top up",
                    type: null,
                    order_id: data.MerchantOrderNo,
                    amount: amount,
                    pay_time: null,
                    details: {},
                    transaction_log_id: null,
                    status: 0,
                    user_id: userId,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });

                // 藍新站內付款
                const newebpayPayload = {
                    P3D: data.P3D,
                    amount: amount,
                    CardNo: decryptResult,
                    Exp: creditCardResult.expiration,
                    CVC: creditCardResult.cvc,
                    userId: userId,
                    NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                    MerchantOrderNo: data.MerchantOrderNo,
                    typeReturnUrl: 3,
                };
                const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
                const result = await this.newebpayService.runPay(resultEncrypt.encrypted);

                if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                    console.log("沒有透過3d驗證");
                    // Update user wallet
                    const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                    userModel.set({ "wallet.balance": parseInt(amount) + parseInt(originBalance) });
                    await userModel.save();
                    console.log("更新user wallet");
                    // transaction_logs
                    const transaction = {
                        user_id: userId,
                        vested_on: moment().format("YYYY-MM-DD"),
                        type: "TOP_UP",
                        details: { Result: result.data },
                        amount: amount,
                        balance: parseInt(amount) + parseInt(originBalance),
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        balance_id: null,
                        broker_id: null,
                        commission: "0",
                    };
                    await this.addTransactionLogs(transaction);
                    console.log("紀錄transaction_logs");

                    // 寫入系統日誌 儲值
                    const platformlog = {
                        level: "info",
                        type: "balance",
                        action: "top up",
                        user_id: userId,
                        administrator_id: null,
                        address: { REMOTE_ADDR: req.ip },
                        target_type: "users",
                        target_id: userId,
                        payload: {
                            amount: amount,
                            userId: userId,
                        },
                        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    };
                    await this.addPlatformLogs(platformlog);
                    console.log("紀錄Platform_Logs");

                    // 建立預約單 API
                    await this.demand(data, authorization, data.MerchantOrderNo);
                    console.log("支付預約費用完成並建立即可快閃");
                    return Object.assign(result.data, { SMessage: "支付預約費用完成並建立即可快閃" });
                } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                    console.log("成功取得3D HTML");
                    return result.data;
                } else {
                    throw new AxiosError(JSON.stringify(result.data));
                }
            }
        } catch (error) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "以指定已儲存信用卡預約即可快閃失敗",
                    error: {
                        error: "n12004",
                        msg: error.message,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async payCreditCardByCreditCardID(authorization: any, data: any, creditCardID: string, req: any) {
        const { userId, token } = await this.getUserIdAndToken(authorization);

        try {
            const creditCardResult = await this.creditCardRepository.findOne<CreditCard>({
                where: {
                    user_id: userId,
                    id: creditCardID,
                },
                attributes: ["id", "number", "expiration", "cvc", "cardholder", "issuer", "comment", "is_default", "status"],
            });
            if (creditCardResult === null) {
                throw new Error("此信用卡不存在");
            }

            // check P3D
            data = await this.checkP3D(data, userId, token, req.userData.banana_id, req.userData.status);
            // payment
            await this.paymentsRepository.create<Payments>({
                reason: "Top up",
                type: null,
                order_id: data.MerchantOrderNo,
                amount: data.amount,
                pay_time: null,
                details: {},
                transaction_log_id: null,
                status: 0,
                user_id: userId,
                created_at: Date.now(),
                updated_at: Date.now(),
            });
            const decryptResult = await this.decryptByCreditCard({ value: creditCardResult.number });

            const newebpayPayload = {
                P3D: data.P3D,
                amount: data.amount,
                CardNo: decryptResult,
                Exp: creditCardResult.expiration,
                CVC: creditCardResult.cvc,
                userId: userId,
                NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                MerchantOrderNo: data.MerchantOrderNo,
                typeReturnUrl: 1,
                idReturnUrl: null,
            };

            // 判斷是即刻快閃自訂價格儲值時 需導頁到即刻快閃詳情頁 因此多加參數判斷
            if (req.query.type === "rightNowActivity") {
                newebpayPayload.typeReturnUrl = req.query.type;
                newebpayPayload.idReturnUrl = req.query.id;
            }

            const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
            const result = await this.newebpayService.runPay(resultEncrypt.encrypted);
            if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                // 查詢錢包餘額
                const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
                const balance = await this.usersRepository.findOne<User>({
                    where: {
                        id: userId,
                    },
                    attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
                });
                const originBalance = balance["dataValues"].balance;
                const finalAmount = parseInt(data.amount) + parseInt(originBalance);
                // Update user wallet
                const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                userModel.set({ "wallet.balance": finalAmount });
                await userModel.save();
                // transaction_logs
                const transaction = {
                    user_id: userId,
                    vested_on: moment().format("YYYY-MM-DD"),
                    type: "TOP_UP",
                    details: { Result: result.data },
                    amount: data.amount,
                    balance: finalAmount,
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    balance_id: null,
                    broker_id: null,
                    commission: "0",
                };
                await this.addTransactionLogs(transaction);

                // 寫入系統日誌 儲值
                const platformlog = {
                    level: "info",
                    type: "balance",
                    action: "top up",
                    user_id: userId,
                    administrator_id: null,
                    address: { REMOTE_ADDR: req.ip },
                    target_type: "users",
                    target_id: userId,
                    payload: {
                        amount: data.amount,
                        userId: userId,
                    },
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                };
                await this.addPlatformLogs(platformlog);
                // TODO: 請款API
                const newebpayPayloadCLose = {
                    RespondType: "JSON",
                    Version: process.env.NEWEBPAY_VERSION,
                    Amt: data.amount,
                    MerchantOrderNo:
                        data.MerchantOrderNo === undefined ? await this.usersHelper.createBananaId("s", moment().valueOf()) : data.MerchantOrderNo,
                    TimeStamp: moment().valueOf(),
                    IndexType: 1,
                    TradeNo: data.MerchantOrderNo,
                    CloseType: 1,
                };
                const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                console.log("runPaycloseresult");
                // console.log(runPaycloseresult.data);
                return Object.assign(result.data, { SMessage: "信用卡儲值成功" });
            } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                console.log("成功取得3D HTML");
                return result.data;
            } else {
                throw new AxiosError(JSON.stringify(result.data));
            }
        } catch (error) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "以指定已儲存信用卡儲值失敗",
                    error: {
                        error: "n12004",
                        msg: error.message,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async creditCardAndCreate(authorization, data, req: any) {
        const { userId, token } = await this.getUserIdAndToken(authorization);

        try {
            // check P3D
            data = await this.checkP3D(data, userId, token, req.userData.banana_id, req.userData.status);
            console.log(data);
            // payment
            await this.paymentsRepository.create<Payments>({
                reason: "Top up",
                type: null,
                order_id: data.MerchantOrderNo,
                amount: data.amount,
                pay_time: null,
                details: {},
                transaction_log_id: null,
                status: 0,
                user_id: userId,
                created_at: Date.now(),
                updated_at: Date.now(),
            });
            const newebpayPayload = {
                P3D: data.P3D,
                amount: data.amount,
                CardNo: data.number,
                Exp: data.expiration,
                CVC: data.cvc,
                userId: userId,
                NotifyURL: `${process.env.HOST}/api/credit-card/notify`,
                MerchantOrderNo: data.MerchantOrderNo,
                typeReturnUrl: 1,
                idReturnUrl: null,
            };

            // 判斷是即刻快閃自訂價格儲值時 需導頁到即刻快閃詳情頁 因此多加參數判斷

            if (req.query.type === "rightNowActivity") {
                newebpayPayload.typeReturnUrl = req.query.type;
                newebpayPayload.idReturnUrl = req.query.id;
            }

            // Newebpay
            const resultEncrypt = await this.newebpayService.encrypt(newebpayPayload);
            const result = await this.newebpayService.runPay(resultEncrypt.encrypted);
            if (result.data.Status === "SUCCESS" && result.data.Message !== "成功取得3D HTML") {
                // 查詢錢包餘額
                const JSON_KEY = (field, key) => `JSON_EXTRACT(${field},"$.${key}")`;
                const balance = await this.usersRepository.findOne<User>({
                    where: {
                        id: userId,
                    },
                    attributes: [[JSON_KEY("wallet", "balance"), "balance"]],
                });
                const originBalance = balance["dataValues"].balance;
                const finalAmount = parseInt(data.amount) + parseInt(originBalance);
                // Update user wallet
                const userModel = await this.usersRepository.findOne({ where: { id: userId } });
                userModel.set({ "wallet.balance": finalAmount });
                await userModel.save();
                // transaction_logs
                const transaction = {
                    user_id: userId,
                    vested_on: moment().format("YYYY-MM-DD"),
                    type: "TOP_UP",
                    details: { Result: result.data },
                    amount: data.amount,
                    balance: finalAmount,
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    balance_id: null,
                    broker_id: null,
                    commission: "0",
                };
                await this.addTransactionLogs(transaction);
                // 寫入系統日誌 儲值
                const platformlog = {
                    level: "info",
                    type: "balance",
                    action: "top up",
                    user_id: userId,
                    administrator_id: null,
                    address: { REMOTE_ADDR: req.ip },
                    target_type: "users",
                    target_id: userId,
                    payload: {
                        amount: data.amount,
                        userId: userId,
                    },
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                };
                await this.addPlatformLogs(platformlog);

                // TODO: 請款API
                const newebpayPayloadCLose = {
                    RespondType: "JSON",
                    Version: process.env.NEWEBPAY_VERSION,
                    Amt: data.amount,
                    MerchantOrderNo:
                        data.MerchantOrderNo === undefined ? await this.usersHelper.createBananaId("s", moment().valueOf()) : data.MerchantOrderNo,
                    TimeStamp: moment().valueOf(),
                    IndexType: 1,
                    TradeNo: data.MerchantOrderNo,
                    CloseType: 1,
                };
                const resultEncryptClose = await this.newebpayService.onlyEncrypt(newebpayPayloadCLose);
                const runPaycloseresult = await this.newebpayService.runPayclose(resultEncryptClose.encrypted);
                console.log("runPaycloseresult");
                console.log(runPaycloseresult.data);
            } else if (result.data.Status === "SUCCESS" && result.data.Message === "成功取得3D HTML") {
                console.log("成功取得3D HTML");
                // return result.data;
            } else {
                throw new AxiosError(JSON.stringify(result.data));
            }

            return await this.isSave(result, data, userId);
        } catch (error) {
            console.log(error);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "儲值並新增信用卡",
                    error: {
                        error: "n12004",
                        msg: error.message,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async deleteCreditCard(authorization, creditCardId, req: any) {
        const { userId } = await this.getUserIdAndToken(authorization);
        // 寫入系統日誌 刪除信用卡
        const creditCardByUserIdAndCreditCardId = await this.creditCardRepository.findAll<CreditCard>({
            where: {
                id: creditCardId,
                user_id: userId,
            },
            raw: true,
        });
        // 寫入系統日誌 刪除信用卡
        const platformlog = {
            level: "info",
            type: "credit card",
            action: "delete",
            user_id: userId,
            administrator_id: null,
            address: { REMOTE_ADDR: req.ip },
            target_type: "users",
            target_id: userId,
            payload: creditCardByUserIdAndCreditCardId,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        await this.addPlatformLogs(platformlog);
        const delCard = await this.creditCardRepository.destroy<CreditCard>({
            where: {
                id: creditCardId,
                user_id: userId,
            },
        });
        const checkIsDefaultCount = await this.creditCardRepository.count<CreditCard>({
            where: {
                is_default: true,
                user_id: userId,
            },
        });

        // if no is_default
        if (checkIsDefaultCount === 0) {
            const creditCardB = await this.creditCardRepository.findAll<CreditCard>({
                where: {
                    user_id: userId,
                },
                order: [["created_at", "DESC"]],
                raw: true,
            });

            // if no card no action
            if (creditCardB[0] !== undefined) {
                await this.creditCardRepository.update<CreditCard>(
                    {
                        is_default: true,
                    },
                    {
                        where: {
                            id: creditCardB[0].id,
                            user_id: userId,
                        },
                    }
                );
            }
        }
        return delCard;
    }

    async settingDefaultCreditCard(authorization, creditCardId, req: any) {
        const { userId } = await this.getUserIdAndToken(authorization);
        const creditCardByUserId = await this.creditCardRepository.findAll<CreditCard>({
            where: {
                user_id: userId,
            },
            raw: true,
        });
        // 寫入系統日誌 預設信用卡
        const platformlog = {
            level: "info",
            type: "credit card",
            action: "update",
            user_id: userId,
            administrator_id: null,
            address: { REMOTE_ADDR: req.ip },
            target_type: "users",
            target_id: userId,
            payload: creditCardByUserId,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        await this.addPlatformLogs(platformlog);
        await this.creditCardRepository.update<CreditCard>(
            {
                is_default: false,
            },
            {
                where: {
                    user_id: userId,
                },
            }
        );
        return await this.creditCardRepository.update<CreditCard>(
            {
                is_default: true,
            },
            {
                where: {
                    id: creditCardId,
                    user_id: userId,
                },
            }
        );
    }

    async order(data, authorization: any) {
        // 建立預約單 API
        // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/dating/store.md

        const orderHeadersRequest = {
            authorization: authorization.indexOf("Bearer") === -1 ? "Bearer " + authorization : authorization,
            Accept: "aplication/json",
        };

        const tipRequest = {
            tip: parseInt(data.tip),
        };

        const orderBodysRequest = {
            provider_id: data.provider_id,
            category_id: data.category_id,
            date: data.date,
            time: data.time,
            district: data.district,
            location: data.location,
            duration: data.duration,
            description: data.description,
            pay_voucher: data.pay_voucher,
        };

        if (data.tip !== undefined) {
            Object.assign(orderBodysRequest, tipRequest);
        }

        await this.http
            .post(`${this.phpAPI}/datings`, orderBodysRequest, { headers: orderHeadersRequest })
            .toPromise()
            .catch((error) => {
                throw new AxiosError(error.response.data);
            });
    }

    async demand(data, authorization, order_id: any) {
        console.log("打建立即刻快閃 API");

        // 建立即刻快散 API
        // https://github.com/citybanana/citybanana-document/blob/main/doc/specifications/demand/store-dating.md
        const demandHeadersRequest = {
            authorization: authorization.indexOf("Bearer") === -1 ? "Bearer " + authorization : authorization,
            Accept: "aplication/json",
        };

        const demaandBodysRequest = {
            name: data.name,
            provider_required: data.provider_required,
            hourly_pay: data.hourly_pay,
            district: data.district,
            location: data.location,
            due_at: data.due_at,
            started_at: data.started_at,
            duration: data.duration,
            description: data.description,
            pay_voucher: data.pay_voucher === undefined ? 0 : data.pay_voucher,
            order_id,
        };

        await this.http
            .post(`${this.phpAPI}/demands/datings`, demaandBodysRequest, { headers: demandHeadersRequest })
            .toPromise()
            .catch((error) => {
                throw new AxiosError(error.response.data);
            });
    }

    async redis() {
        const redisClient = this.redisClient;
        async function getRedisData(key) {
            return new Promise((resolve, reject) => {
                redisClient.get(key, (err, val) => {
                    if (err) {
                        console.log(err);
                        reject(false);
                        return;
                    }
                    if (val === null) {
                        reject(false);
                        return;
                    }
                    resolve(val);
                });
            });
        }

        async function setRedisData(key, value) {
            console.log("setRedisData");
            console.log("key");
            console.log(key);
            console.log("value");
            console.log(value);
            return redisClient.setex(key, 3600, value);
        }

        return {
            getRedisData,
            setRedisData,
        };
    }

    async getUserIdAndToken(authorization: any) {
        const token = authorization.replace("Bearer ", "");
        const decode: any = await this.jwtService.decode(token, { complete: true });
        return {
            userId: decode.payload.sub,
            token,
        };
    }

    /**
     *
     * @param result 藍新資訊
     * @param data http request
     * @param userId userId
     * @param amount 金額 判斷是否有透過藍新付款
     * @returns
     */
    async isSave(result, data, userId: any, amount = 0) {
        if (result === undefined) {
            result = { data: {} };
        }
        // Save creditcard
        if (data.is_save === true) {
            const isExist = await this.creditCardRepository
                .findAll<CreditCard>({
                    where: {
                        user_id: userId,
                    },
                    attributes: ["number", "cvc", "expiration"],
                })
                .then(async (i) => {
                    const compareResult = await Promise.all(
                        i.map(async (e) => {
                            const decryptResult = await this.decryptByCreditCard({ value: e.number });
                            if (decryptResult === data.number && e.cvc === data.cvc && e.expiration === data.expiration) {
                                return true;
                            } else {
                                return false;
                            }
                        })
                    );
                    return compareResult.includes(true);
                });

            if (isExist) {
                if (amount < 0) {
                    return "支付預約費用完成並建立預約單, 信用卡已存在";
                } else {
                    return Object.assign(result.data, { SMessage: "信用卡已存在" });
                }
            }

            // Check creditcard count
            const count = await this.creditCardRepository.count({
                where: { user_id: userId },
            });

            if (count === 0) {
                data.is_default = true;
            }
            if (data.is_default === true) {
                await this.creditCardRepository.update<CreditCard>(
                    {
                        is_default: false,
                    },
                    {
                        where: {
                            user_id: userId,
                        },
                    }
                );
            }

            const encrpt = await this.encryptByCreditCard({ value: data.number });

            const headersRequest = {
                "Accept-Version": 3,
            };
            let res;
            try {
                res = await this.http.get(`https://lookup.binlist.net/${data.number.substring(0, 8)}`, { headers: headersRequest }).toPromise();
            } catch (error) {
                throw new AxiosError(error.response.data);
            }
            const creditCard = await this.creditCardRepository.create<CreditCard>({
                number: encrpt,
                expiration: data.expiration,
                cvc: data.cvc,
                cardholder: data.cardholder === undefined || data.cardholder === "" ? "-" : data.cardholder,
                issuer: res.data.bank.name,
                comment: res.data.bank.name + "/" + res.data.scheme + "/" + res.data.type,
                is_default: data.is_default,
                status: 0,
                user_id: userId,
                created_at: Date.now(),
                updated_at: Date.now(),
            });
            await creditCard.save();
            return Object.assign(result.data, { SMessage: "信用卡儲值成功" });
        } else {
            return Object.assign(result.data, { SMessage: "信用卡儲值成功，不存信用卡" });
        }
    }

    /**
     * 確認是否使用信用卡 3d 驗證
     * @param data
     * @param userId
     * @param token
     * @returns
     */
    async checkP3D(data, userId: string, token: string, bananaId: string, status: string | number) {
        // 判斷 env 設定值 是否啟用 3d 驗證
        const enableP3D = this.configService.get("host.creditCard3DValidationEnabled") == 1 ? true : false;
        console.log("enableP3D, status");

        console.log(enableP3D, status);
        // 判斷是否有身分證驗證成功
        if (enableP3D) {
            data.P3D = 0;
        } else {
            data.P3D = 1;
        }
        // if ((enableP3D && status === 1) || (enableP3D && status === 2)) {
        //     // 有身份驗證成功者 無需走 信用卡 3d 驗證
        //     data.P3D = 0;
        // } else {
        //     // 需走 3d 驗證
        //     data.P3D = 1;
        // }
        data.MerchantOrderNo = await this.usersHelper.createBananaId("s", moment().valueOf());
        const redisData = {
            is_Order: false, // input data overwrite
            is_Demand: false, // input data overwrite
            authorization: token, // use to create order
            userId: userId,
            bananaId,
        };
        Object.assign(redisData, data);
        (await this.redis()).setRedisData(data.MerchantOrderNo, JSON.stringify(redisData));
        // }
        return data;
    }

    async addTransactionLogs(data) {
        const transactionLogs = await this.transactionLogsRepository.create<TransactionLogs>({
            user_id: data.user_id,
            vested_on: data.vested_on,
            type: data.type,
            details: { Result: data.details },
            amount: data.amount,
            balance: data.balance,
            created_at: data.created_at,
            updated_at: data.updated_at,
            balance_id: data.balance_id,
            broker_id: data.broker_id,
            commission: data.commission,
        });

        return transactionLogs.save();
    }

    async addPlatformLogs(data) {
        const platformLogs = await this.platformLogsRepository.create<PlatformLogs>({
            level: data.level,
            type: data.type,
            action: data.action,
            user_id: data.user_id,
            administrator_id: null,
            address: data.address,
            target_type: data.target_type,
            target_id: data.target_id,
            payload: data.payload,
            created_at: data.created_at,
            updated_at: data.updated_at,
        });
        await platformLogs.save();
    }
}
