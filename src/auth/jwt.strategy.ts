import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 判斷是否驗證令牌到期日 true 為不驗證
            ignoreExpiration: false,
            jsonWebTokenOptions: {},
            secretOrKey: process.env.JWT_SECRET,
            algorithms: [process.env.JWT_ALGO],
        });
    }

    async validate(payload: any) {
        const user = await this.authService.validateJWTVersion({ userId: payload.sub, iat: payload.iat });
        if (!user) {
            throw new UnauthorizedException("Unauthenticated.");
        }
        return { sub: payload.sub, phone: payload.phone, iat: payload.iat };
    }

    getJWTSub(payload: any) {
        return payload.sub;
    }
}
