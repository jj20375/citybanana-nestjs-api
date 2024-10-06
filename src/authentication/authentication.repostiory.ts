import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { info } from "console";
import moment from "moment";
import { Op, Transaction } from "sequelize";
import { AdministratorUser } from "src/admin/users/administrator/administrator-user.entity";
import { User } from "src/users/user.entity";
import { Authentication } from "./authentication.entity";
import { AuthenticationUpdateDto } from "./dto/authendicationUpdateDto.dto";
@Injectable()
export class AuthenticationRepository {
    constructor(
        @Inject("AUTHENTICATION_REPOSITORY")
        private authenticationRepository: typeof Authentication
    ) {}

    /**
     * 取得列表資料與分頁機制
     * @param data
     * @returns
     */
    async findAll(data: { filterOptions?: any; page: number; limit: number }): Promise<any> {
        // 判斷未給予預設顯示幾筆時 顯示 15筆
        data.limit = data.limit === undefined ? 15 : data.limit;
        // 判斷未給予分頁時 預設為第1頁
        data.page = data.page === undefined ? 1 : data.page;
        // 計算下次分頁資料從哪一筆開始撈取
        const offset = (Number(data.page) - 1) * data.limit;
        // 搜尋條件
        const query = {};
        // 判斷是否有給予 開始時間 跟 結束時間 key
        if (data.filterOptions.hasOwnProperty("start_date") || data.filterOptions.hasOwnProperty("end_date")) {
            // 搜尋條件採用 between (因為需要一搜尋條件找尋最後一日的結果 因此最後一日需加上 23:59:59 時辰)
            query["created_at"] = { [Op.between]: [data.filterOptions.start_date, data.filterOptions.end_date + " 23:59:59"] };
        }
        // 關聯表 keys
        const relationshipKeys = ["name", "real_name", "phone"];
        // 關聯表搜尋方式
        const relationshipQuery = {
            [Op.and]: [],
        };

        Object.keys(data.filterOptions).forEach((objKey) => {
            // 判斷是手機號碼搜尋時 使用 and 條件
            if (relationshipKeys.includes(objKey) && objKey === "phone") {
                const keyValue = {};
                keyValue[objKey] = data.filterOptions[objKey];
                relationshipQuery[Op.and] = [...relationshipQuery[Op.and], keyValue];
            }
            // 判斷非手機號碼 也就是說 name 跟 real_name key 採用 like 搜尋
            if (relationshipKeys.includes(objKey) && objKey !== "phone") {
                relationshipQuery[objKey] = { [Op.substring]: data.filterOptions[objKey] };
            }
        });
        // 刪除關聯表搜尋 key 與分頁跟單頁幾筆資料 key
        delete data.filterOptions.page;
        delete data.filterOptions.limit;
        delete data.filterOptions.start_date;
        delete data.filterOptions.end_date;
        delete data.filterOptions.name;
        delete data.filterOptions.real_name;
        delete data.filterOptions.phone;
        query[Op.and] = [data.filterOptions];

        try {
            const datas = await this.authenticationRepository.findAndCountAll<Authentication>({
                where: query,
                offset,
                limit: Number(data.limit),
                include: [
                    { model: User, where: relationshipQuery, attributes: { exclude: ["id", "password"] } },
                    { model: AdministratorUser, attributes: ["id", "name"] },
                ],
                // 預設使用  申請時間倒序
                order: [["created_at", "DESC"]],
            });
            const lastPage = datas.count > 0 ? Math.ceil(datas.count / data.limit) : 0;
            const result = {
                data: datas.rows,
                current_page: Number(data.page),
                last_page: lastPage,
                total: datas.count,
                from: Number(data.page - 1) === 0 ? 1 : Number(data.limit) + Number(data.page - 1),
                to: Number(data.limit) * Number(data.page),
                per_page: Number(data.limit),
            };
            return result;
        } catch (err) {
            return err;
        }
    }

    /**
     * 取得單一資料
     * @param data
     * @returns
     */
    async findOne(data: { column: string; value: any }): Promise<Authentication> {
        const query = {};
        query[data.column] = data.value;
        try {
            const data = await this.authenticationRepository.findOne<Authentication>({
                where: query,
                include: [User],
            });
            return data;
        } catch (err) {
            return err;
        }
    }

    /**
     * 更新
     * @param data
     * @returns
     */
    async update(data: AuthenticationUpdateDto) {
        try {
            await this.authenticationRepository.update<Authentication>(
                {
                    ...data,
                    closed_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                },
                { where: { id: data.id } }
            );
        } catch (err) {
            return err;
        }
    }
}
