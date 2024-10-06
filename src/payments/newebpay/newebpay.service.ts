import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// 加解密套件
import crypto from "crypto";
// 將物件轉換為 url query string 套件
import querystring from "query-string";
// ajax 模擬表單發送
import FormData from "form-data";
// 時間轉換套件
import moment from "moment";
import { UsersHelperService } from "../../users/users-helper.service";

@Injectable()
export class NewebpayService {
    private algorithm: string;
    private iv: string;
    private key: string;
    private creditCardKey: string;

    constructor(private readonly http: HttpService, private readonly configService: ConfigService, private readonly usersHelper: UsersHelperService) {
        this.algorithm = "aes-256-cbc";
        this.iv = process.env.NEWEBPAY_HASH_IV;
        this.key = process.env.NEWEBPAY_HASH_KEY;
        this.creditCardKey = process.env.CREDIT_CARD_SECRET;
    }
    /**
     * 藍新站內付款信用卡訂單加密方式
     * @param data
     * @returns
     */
    async encrypt(data: any) {
        const mid = process.env.NEWEBPAY_MERCHANT_ID;
        const payVersion = process.env.NEWEBPAY_VERSION;
        /**
         * 定义加密函数
         * @param {string} data - 需要加密的数据, 传过来前先进行 JSON.stringify(data);
         * @param {string} key - 加密使用的 key
         */
        const aesEncrypt = (data, key) => {
            // 加密規則 ase-256-cbc
            const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key), this.iv);
            // 設定 Pkcs7 padding （自動補足缺少位元）
            cipher.setAutoPadding(true);
            let encrypted = cipher.update(data);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            // 將加密後數據 轉換成 hex 字串格式
            return encrypted.toString("hex");
        };

        // 藍新return回前端判斷使用
        const typeReturnUrl = data.typeReturnUrl === undefined ? "" : `&pay_category=${data.typeReturnUrl}`;

        let returnUrl = `${this.configService.get("host.clientHost")}/payment?type=3dVerify${typeReturnUrl}`;
        if (data.typeReturnUrl === "rightNowActivity") {
            returnUrl = `${this.configService.get("host.clientHost")}/api/callbackPayment?type=${data.typeReturnUrl}&id=${data.idReturnUrl}`;
        }
        // 获取填充后的key
        const payData = querystring.stringify({
            NotifyURL: data.NotifyURL === undefined ? `${this.configService.get("host.newebpayNotifyURL")}/credit-card/notify` : data.NotifyURL,
            ReturnURL: returnUrl,
            MerchantID: mid,
            TimeStamp: moment().valueOf(),
            Version: payVersion,
            P3D: data.P3D === undefined ? "0" : data.P3D,
            MerchantOrderNo:
                data.MerchantOrderNo === undefined ? await this.usersHelper.createBananaId("s", moment().valueOf()) : data.MerchantOrderNo,
            Amt: data.amount,
            ProdDesc: "測試3d交易",
            PayerEmail: "MyMail@mycomp.com",
            CardNo: data.CardNo,
            Exp: data.Exp,
            CVC: data.CVC,
        });
        // 调用加密函数
        const encrypted = aesEncrypt(payData, this.key);
        // 控制台输出查看结果
        // console.log("加密结果: ", encrypted);
        return { encrypted };
    }

    /**
     * 藍新站內付款信用卡訂單解密方式
     * @param data
     * @returns
     */
    async decrypt(data: { value: string }) {
        const encryptedData = data.value;
        const encryptedText = Buffer.from(encryptedData, "hex");
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), this.iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        console.log("解密结果: ", decrypted);
        return decrypted.toString();
    }

    async runPay(data: any) {
        const mid = process.env.NEWEBPAY_MERCHANT_ID;
        const bodyFormData = new FormData();
        bodyFormData.append("MerchantID_", mid);
        bodyFormData.append("PostData_", data);
        bodyFormData.append("Pos_", "JSON");
        try {
            console.log("call藍新api");
            console.log("給藍新的參數資訊");
            console.log(process.env.NEWEBPAY_CREDITCARD_PAY_URL, bodyFormData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            console.time();
            const result = await this.http
                .post(process.env.NEWEBPAY_CREDITCARD_PAY_URL, bodyFormData, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "User-Agent": "newebpay_83155824",
                    },
                })
                .toPromise();
            console.timeEnd();
            console.log("藍新回傳結果");
            console.log(result);
            return result;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "藍新付款失敗",
                    error: {
                        error: "藍新付款失敗",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async runPayclose(data: any) {
        const mid = process.env.NEWEBPAY_MERCHANT_ID;
        const bodyFormData = new FormData();
        bodyFormData.append("MerchantID_", mid);
        bodyFormData.append("PostData_", data);
        bodyFormData.append("Pos_", "JSON");
        try {
            console.log("call藍新api");
            console.log("給藍新的參數資訊");
            console.log(`${process.env.NEWEBPAY_CREDITCARD_PAY_URL}/Close`, bodyFormData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            console.time();
            const result = await this.http
                .post(`${process.env.NEWEBPAY_CREDITCARD_PAY_URL}/Close`, bodyFormData, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                })
                .toPromise();
            console.timeEnd();
            console.log("藍新回傳結果");
            console.log(result);
            return result;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "藍新付款失敗",
                    error: {
                        error: "藍新付款失敗",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 藍新加密
     * @param data
     * @returns
     */
    async onlyEncrypt(data: any) {
        /**
         * 定义加密函数
         * @param {string} data - 需要加密的数据, 传过来前先进行 JSON.stringify(data);
         * @param {string} key - 加密使用的 key
         */
        const aesEncrypt = (data, key) => {
            // 加密規則 ase-256-cbc
            const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key), this.iv);
            // 設定 Pkcs7 padding （自動補足缺少位元）
            cipher.setAutoPadding(true);
            let encrypted = cipher.update(data);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            // 將加密後數據 轉換成 hex 字串格式
            return encrypted.toString("hex");
        };

        // 获取填充后的key
        const payData = querystring.stringify(data);
        // 调用加密函数
        const encrypted = aesEncrypt(payData, this.key);
        // 控制台输出查看结果
        // console.log("加密结果: ", encrypted);
        return { encrypted };
    }
}
