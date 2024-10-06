import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Transaction } from "sequelize";
import { ActivityRepository } from "src/activity/activity.repository";
import { UsersRepository } from "../users.repository";
import { ActivityUserRepository } from "src/activity/activity-user.repository";

@Injectable()
export class ProviderService {
    private phpAPI: string;
    constructor(
        private http: HttpService,
        private readonly configService: ConfigService,
        private readonly activityRepository: ActivityRepository,
        private readonly usersRepository: UsersRepository,
        private readonly activityUserRepository: ActivityUserRepository
    ) {
        this.phpAPI = this.configService.get("host.phpAPI");
    }
    /**
     * 取得服務商資料
     * @param userId
     * @returns
     */
    async getDataApi(userId: string): Promise<any> {
        try {
            const res = await this.http.get(`${this.phpAPI}/providers/${userId}`).toPromise();
            return res.data;
        } catch (err) {
            console.log(err);
            Logger.log("取得服務商資料失敗", err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得服務商資料失敗",
                    error: {
                        error: "n3001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 列出所有可參與活動
     * @returns
     */
    async getActivities(): Promise<any> {
        return await this.activityRepository.findAll();
    }

    /**
     * 更新使用者可參與活動
     * @param userId
     * @param activities
     * @param transaction
     */
    async updateActivitiesByUser(userId: string, activities: [number], transaction: Transaction): Promise<any> {
        // Check the user exist
        const exist = await this.usersRepository.findOne({ column: "id", value: userId });
        if (exist == null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    msg: "取得服務商資料失敗",
                    error: {
                        error: "n3001",
                        msg: "取得服務商資料失敗",
                    },
                },
                HttpStatus.NOT_FOUND
            );
        }
        // Filter no exist activity
        const activitiesIds: number[] = await (await this.activityRepository.whereInIds(activities)).map((item) => item.id);
        await this.activityUserRepository.destroyByUserId(userId, transaction);
        await this.activityUserRepository.bulkCreate({ activitiesIds, userId }, transaction);
    }
}
