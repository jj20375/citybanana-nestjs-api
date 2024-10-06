import { ExecutionContext, Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
@Injectable()
export class JwtAuthPHPServerGuard extends AuthGuard("jwt") {
    canActivate(context: ExecutionContext) {
        // Add your custom authentication logic here
        // for example, call super.logIn(request) to establish a session.
        return super.canActivate(context);
    }

    handleRequest(err, user, info, context, status) {
        if (user.sub !== 1) {
            throw err || new UnauthorizedException("Unauthenticated.");
        }
        // // You can throw an exception based on either "info" or "err" arguments
        // if (err || !user) {
        //     throw err || new UnauthorizedException("Unauthenticated.");
        // }
        return user;
    }
}
