import { Controller, Get } from "@nestjs/common";
import { RedisCacheService } from "./redis-cache.service";
@Controller("redis-cache")
export class RedisCacheController {
    constructor(private redisCacheService: RedisCacheService) {}

    @Get()
    async getKeys() {
        console.log(await this.redisCacheService.keys());
    }
}
