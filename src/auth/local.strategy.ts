import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            /**
             * 修改 passport 預設登入時 改用 phone key 作為帳號
             * 預設只能傳送 username key 作為帳號
             */
            usernameField: "phone",
        });
    }
    async validate(phone: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(phone, password);
        if (!user) {
            throw new UnauthorizedException("Unauthenticated.");
        }
        return user;
    }
}
