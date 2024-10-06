/**
 * 三竹簡訊 回傳格式
 */
export interface IMitakeSmSendResponse {
    clientid: number[];
    msgid: string;
    statuscode: number;
    AccountPoint: number;
}
