import { Injectable } from "@nestjs/common";
import { AdministratorUserRepository } from "./administrator-user.repository";
import { AdministratorUser } from "./administrator-user.entity";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class AdministratorService {
    constructor(public adminRepository: AdministratorUserRepository, private readonly configService: ConfigService) {}
    /**
     * 驗證 cms 登入者
     * @param id 登入者 id
     * @returns
     */
    async validateUser(data: { sub: string | number; iss: string }): Promise<AdministratorUser> {
        // 比對 jwt 發行網址 (因為 發行方無法指定 https 因此 忽略 http 或 https 判斷 只判斷 網域跟路徑)
        const verifyHost = `${this.configService.get("host.phpAPI")}/backyard/login`.replace(/(^\w+:|^)\/\//, "");
        // 比對 refresh jwt 發行網址 (因為 發行方無法指定 https 因此 忽略 http 或 https 判斷 只判斷 網域跟路徑)
        const verifyHostRefresh = `${this.configService.get("host.phpAPI")}/backyard/refresh`.replace(/(^\w+:|^)\/\//, "");
        // jwt 發行網址 (因為 發行方無法指定 https 因此 忽略 http 或 https 判斷 只判斷 網域跟路徑)
        const jwtIss = data.iss.replace(/(^\w+:|^)\/\//, "");
        // 判斷 jwt 發行網址不匹配於 cms 使用時回傳 null
        if (jwtIss !== verifyHost && jwtIss !== verifyHostRefresh) {
            return null;
        }
        const user: any = await this.adminRepository.findOne({ column: "id", value: data.sub });
        if (user === null) {
            return null;
        }
        return user.dataValues;
    }

    async findOneById(id: string | number): Promise<AdministratorUser> {
        const user: any = await this.adminRepository.findOne({ column: "id", value: id });
        return user;
    }
}
