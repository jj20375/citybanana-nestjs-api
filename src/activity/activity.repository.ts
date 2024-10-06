import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Op } from "sequelize";
import { Activity } from "./activities.entity";

@Injectable()
export class ActivityRepository {
    constructor(
        @Inject("ACTIVITIES_REPOSITORY")
        private activityRepository: typeof Activity
    ) {}

    async findAll(): Promise<Activity[]> {
        try {
            return await this.activityRepository.findAll<Activity>({
                attributes: ["name", "id"],
            });
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得可參與活動資料失敗",
                    error: {
                        error: "n3014",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 透過 id 尋找相對應資料
     * @param ids 搜尋 id 陣列
     * @returns
     */
    async whereInIds(ids: [number]): Promise<Activity[]> {
        try {
            const datas = await this.activityRepository.findAll<Activity>({
                where: {
                    id: { [Op.in]: ids },
                },
                attributes: ["id"],
            });
            return datas;
        } catch (err) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得可參與活動資料失敗",
                    error: {
                        error: "n3014",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
