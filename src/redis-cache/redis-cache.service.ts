import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";
@Injectable()
export class RedisCacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}
    async get(key): Promise<any> {
        return await this.cache.get(key);
    }

    /**
     * 設定 redis 資料
     * @param key 設定 key
     * @param value 設定值
     * @param time 保存時間（秒數)
     */
    async set(data: { key: string; value: string; time: number }) {
        await this.cache.set(data.key, data.value, { ttl: data.time });
    }

    async reset() {
        await this.cache.reset();
    }

    async del(key) {
        await this.cache.del(key);
    }

    async keys() {
        return await this.cache.keys();
    }

    setRedisKey(data: { type: string; category: string; id: string }) {
        return `${data.type}:${data.category}:${data.id}`;
    }
}
