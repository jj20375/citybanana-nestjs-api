import { ExecutionContext, Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class FacebookAuthGuard extends AuthGuard("facebook") {
    canActivate(context: ExecutionContext) {
        // Add your custom authentication logic here
        // for example, call super.logIn(request) to establish a session.
        return super.canActivate(context);
    }

    handleRequest(err, user, info, context, status) {
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            throw new UnauthorizedException("Facebook access token 驗證失敗");
        }
        return user;
    }
}
