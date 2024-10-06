import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Transaction } from "sequelize";
import { ActivityUser } from "./activity-user.entity";
@Injectable()
export class ActivityUserRepository {
    constructor(
        @Inject("ACTIVITY_USER_REPOSITORY")
        private activityUserRepository: typeof ActivityUser
    ) {}

    /**
     * 指定 user_id 刪除
     */
    async destroyByUserId(userId: number | string, transaction: Transaction): Promise<void> {
        try {
            await this.activityUserRepository.destroy({ where: { user_id: userId }, transaction });
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "刪除指定 user id 可參與活動失敗",
                    error: {
                        error: "n9001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 批量新增
     */
    async bulkCreate(data: { activitiesIds: number[]; userId: number | string }, transaction: Transaction): Promise<any> {
        try {
            await this.activityUserRepository.bulkCreate(
                data.activitiesIds.map((activity) => {
                    return {
                        user_id: data.userId,
                        activity_id: activity,
                        created_at: Date.now(),
                        updated_at: Date.now(),
                    };
                }),
                { transaction }
            );
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "批量新增 指定使用者 可參與活動失敗",
                    error: {
                        error: "n9002",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
