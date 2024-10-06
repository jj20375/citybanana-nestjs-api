import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class RewriteApiEndpointMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        req.url = req.url.replace(/^\/api/, ""); // <--- not the .originalUrl
        next();
    }
}
