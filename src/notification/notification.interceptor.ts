import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { LoggerService } from "src/logger/logger.service";

export interface Response<T> {
    data: T;
}

@Injectable()
export class NotificationInterceptor<T> implements NestInterceptor<T, Response<T>> {
    constructor(private loggerService: LoggerService) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        console.log("Before...");
        console.log(context.switchToHttp().getRequest().body);
        this.loggerService.http(context.switchToHttp().getRequest().body);
        const now = Date.now();
        return next.handle().pipe(
            map((data) => {
                // console.log(data);
                return {
                    data,
                    statusCode: context.switchToHttp().getResponse().statusCode,
                    message: context.switchToHttp().getRequest().body,
                };
            })
        );
    }
}
