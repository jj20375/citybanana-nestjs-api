//判斷是否為空值或空物件
export const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        (typeof value === "object" && Object.keys(value).length === 0) ||
        (typeof value === "string" && value.trim().length === 0) ||
        value.length === 0
    );
};
// 產生隨機數
export const createRandom = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
