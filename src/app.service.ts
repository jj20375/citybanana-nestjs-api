import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
    constructor(private readonly configService: ConfigService) {}
    getHello(): object {
        const name = "hello world";
        const PORT: number = this.configService.get("PORT");
        return { name };
    }
}
