import { Injectable, Logger, forwardRef, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { InvitationCodeRepository } from "./invitation-code.repository";
import { InvitationCodeTypes } from "./enums/invitation-code.enum";
import { PromotersRepository } from "src/promoters/promoters.repository";
import { PromotersStatus } from "src/promoters/enums/promoters.enum";
import { UserStatus } from "src/users/enums/users.enum";
import { LoggerService } from "src/logger/logger.service";
@Injectable()
export class InvitationCodeService {
    constructor(
        private readonly invitationCodeRepository: InvitationCodeRepository,
        private readonly prmotersRepository: PromotersRepository,
        @Inject(forwardRef(() => LoggerService))
        private readonly loggerService: LoggerService
    ) {}

    /**
     * 驗證邀請碼是否有效
     * @param data
     * @key { type String(字串) } code 邀請碼
     * @returns {
     * valid: 0 or 1 { type Number(數字) }
     * }
     */
    async verifyInvitationCodeByServer(data: { code: string }): Promise<{ valid: number }> {
        const invitationCode = await this.invitationCodeRepository.findOne({
            column: "code",
            value: data.code,
        });
        // 判斷是否此邀請碼是否存在
        if (invitationCode === null) {
            return { valid: 0 };
        }
        // 判斷使用者狀態小於 0 時 代表此用戶停權或永久停權 因此邀請碼無效
        if (invitationCode.user.status < UserStatus.NORMAL) {
            return { valid: 0 };
        }
        // 判斷是城市推廣員的邀請碼時 才觸發
        if (invitationCode.type === InvitationCodeTypes.TYPE_PROMOTER) {
            // 尋找城市推廣員資料
            const promoter = await this.prmotersRepository.findOne({
                column: "user_id",
                value: invitationCode.user_id,
            });
            // 判斷 是否有此城市推廣員 或者 狀態不是審核通過的
            if (promoter === null || promoter.status !== PromotersStatus.APPROVED) {
                return { valid: 0 };
            }
        }
        return { valid: 1 };
    }
    /**
     * 驗證邀請碼是否有效
     * @param data
     * @key { type String(字串) } code 邀請碼
     * @returns {
     * valid: 0 or 1 { type Number(數字) }
     * }
     */
    async verifyInvitationCodeByClient(data: { code: string }): Promise<{ valid: number }> {
        const invitationCode = await this.invitationCodeRepository.findOne({
            column: "code",
            value: data.code,
        });
        // 判斷是否此邀請碼是否存在
        if (invitationCode === null) {
            console.log("找不到邀請碼 n7020 => ", invitationCode);
            this.loggerService.error({
                title: "找不到邀請碼 n7020 =>",
                invitationCode,
            });
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "找不到邀請碼",
                    error: {
                        error: "n7020",
                        msg: "找不到邀請碼",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        // 判斷使用者狀態小於 0 時 代表此用戶停權或永久停權 因此邀請碼無效
        if (invitationCode.user.status < UserStatus.NORMAL) {
            console.log("無效邀請碼 n7021 => ", invitationCode.user);
            this.loggerService.error({
                title: "找不到邀請碼 n7021 =>",
                invitationCode,
            });
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "無效邀請碼",
                    error: {
                        error: "n7021",
                        msg: "無效邀請碼",
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
        // 判斷是城市推廣員的邀請碼時 才觸發
        if (invitationCode.type === InvitationCodeTypes.TYPE_PROMOTER) {
            // 尋找城市推廣員資料
            const promoter = await this.prmotersRepository.findOne({
                column: "user_id",
                value: invitationCode.user_id,
            });
            // 判斷 是否有此城市推廣員 或者 狀態不是審核通過的
            if (promoter === null || promoter.status !== PromotersStatus.APPROVED) {
                console.log("無效邀請碼 n7021 => ", promoter, invitationCode.type);
                this.loggerService.error({
                    title: "找不到邀請碼 n7021 =>",
                    invitationCode,
                    promoter,
                });

                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "無效邀請碼",
                        error: {
                            error: "n7021",
                            msg: "無效邀請碼",
                        },
                    },
                    HttpStatus.BAD_REQUEST
                );
            }
        }
        return { valid: 1 };
    }
}
