import { Injectable, HttpStatus, HttpException } from "@nestjs/common";
import { ShortMessageLogRepository } from "./short-message-logs.repository";
@Injectable()
export class ShortMessageLogsService {
    constructor(private shortMessageLogRepository: ShortMessageLogRepository) {}

    /**
     * 設定簡訊驗證碼發送紀錄
     * @param data
     * @returns
     */
    async setVerifyAuthCodeLog(data: any) {
        try {
            const result = await this.shortMessageLogRepository.create(data);
            return result;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "設定簡訊驗證記錄失敗",
                    error: {
                        error: "n15001",
                        msg: err,
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
