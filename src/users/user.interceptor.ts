import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { User } from "src/users/user.entity";
import { Authentication } from "src/authentication/authentication.entity";
import { UsersHelperService } from "./users-helper.service";

export interface Response<T> {
    data: T;
}

@Injectable()
export class UserInterceptor implements NestInterceptor {
    constructor(private readonly usersHelper: UsersHelperService) {}
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        console.log("Before...");
        const request = context.switchToHttp().getRequest();
        let user: any = await User.findOne({ where: { id: request.user.sub }, include: [Authentication] });
        if (user === null) {
            return user;
        }
        user = await user.toJSON();
        /**
         * 圖片縮圖
         */
        const userThumbnails = await this.usersHelper.userThumbnails({
            bananaId: user.banana_id,
            gender: user.gender,
            photos: user.media.photos ?? [],
            videos: user.media.videos ?? [],
        });
        request.userData = { ...user, ...userThumbnails };
        // console.log(request.user);
        return next.handle().pipe(map(async () => ({ ...request })));
    }
}
