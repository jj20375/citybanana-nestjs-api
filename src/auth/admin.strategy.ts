import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AdministratorService } from "src/admin/users/administrator/administrator.service";
@Injectable()
export class AdminStrategy extends PassportStrategy(Strategy, "admin") {
    constructor(private readonly administratorService: AdministratorService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 判斷是否驗證令牌到期日 true 為不驗證
            ignoreExpiration: false,
            jsonWebTokenOptions: {},
            secretOrKey: process.env.JWT_SECRET,
            algorithms: [process.env.JWT_ALGO],
        });
    }
    async validate(payload: { sub: string | number; iss: string }): Promise<any> {
        const user = await this.administratorService.validateUser({ sub: payload.sub, iss: payload.iss });
        if (!user) {
            throw new UnauthorizedException("Unauthenticated.");
        }
        return user;
    }
}
