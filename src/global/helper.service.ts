import { createCipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

// 36進位演算法
export const scale36 = async (n: number) => {
    function getNums36() {
        const nums36 = [];
        for (let i = 0; i < 36; i++) {
            if (i >= 0 && i <= 9) {
                nums36.push(i);
            } else {
                nums36.push(String.fromCharCode(i + 87));
            }
        }
        return nums36;
    }
    // 單獨的功能函式
    // 16進位制數： 0-9  a-f    36進位制數： 0-9  a-z
    const arr = [];
    const nums36 = getNums36();
    // 36 10
    if (!Number.isInteger(n)) {
        //浮點數判斷，目前不支援小鼠
        console.warn("不支援小數轉換");
        return n;
    }
    let neg = "";
    if (n < 0) {
        //對負數的處理
        neg = "-";
        n = Math.abs(n);
    }
    while (n) {
        const res = n % 36;
        arr.unshift(nums36[res]);
        // 進位
        n = Math.floor(n / 36);
    }
    arr.unshift(neg);
    // 只回傳6位字數就好
    return arr.join("").toString().slice(0, 6);
};

//產生隨機數
export const getRandom = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 貨幣 轉譯成三位數加上一個逗號格式
export const formatCurrency = (val) => {
    if (typeof val === "number") {
        const result = Math.floor(val * 100) / 100;
        const num = result.toString().replace(/^(-?\d+?)((?:\d{3})+)(?=\.\d+$|$)/, function (all, pre, groupOf3Digital) {
            return pre + groupOf3Digital.replace(/\d{3}/g, ",$&");
        });
        return num == "NaN" ? 0 : num;
    }
    return 0;
};
