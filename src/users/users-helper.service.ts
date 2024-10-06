import { Injectable, Logger, HttpStatus, HttpException } from "@nestjs/common";
import { scale36, getRandom } from "src/global/helper.service";
import * as bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";
import glob from "glob";
import moment from "moment";
import * as fs from "fs";
import { ActivityRepository } from "src/activity/activity.repository";
import { sortBy } from "lodash/collection";
@Injectable()
export class UsersHelperService {
    private cdnURL: string;
    private phpStorageFolder: string;
    constructor(private readonly configService: ConfigService, private readonly activityRepository: ActivityRepository) {
        this.cdnURL = this.configService.get("host.cdnURL");
        this.phpStorageFolder = this.configService.get("host.phpStorageFolder");
    }
    /**
     * 新增 bananaId
     * @param { type Number(數字)} unixtime unixtime 時間
     * 首碼 u 是使用者, 儲值是 s, 預約單是 d 開頭
     */
    async createBananaId(type: string, unixtime: number): Promise<string> {
        const r1 = getRandom(0, 9);
        const r2 = getRandom(0, 9);
        const r3 = getRandom(0, 9);
        const key = await scale36(unixtime);
        console.log(key);
        console.log(`${type}${key}${r1}${r2}${r3}`);
        return `${type}${key}${r1}${r2}${r3}`;
    }

    /**
     * 加密密碼
     * @param password
     * @returns
     */
    async hashPassword(password: string): Promise<string> {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);
        return hash;
    }

    /**
     * 驗證密碼
     * @param password
     * @param hash
     * @returns
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    }

    /**
     * 個人照片（大頭照、封面照、縮圖等等）
     * @param data
     * @returns
     */
    async userThumbnails(data: { bananaId: string; gender: string; photos: []; videos: [] }) {
        return {
            avatar: await this.getAvatar({ ...data, path: "user/avatar" }),
            photos: await this.getPhotos({ ...data, path: `${data.bananaId}` }),
            videos: await this.getVideos({ ...data, path: `${data.bananaId}` }),
            thumbnails: {
                avatar: {
                    "360x360": await this.getAvatar({ ...data, path: "user/avatar/360" }),
                    "720x720": await this.getAvatar({ ...data, path: "user/avatar/720" }),
                },
                cover: {
                    "360x360": await this.getAvatar({ ...data, path: "user/cover/360" }),
                    "720x720": await this.getAvatar({ ...data, path: "user/cover/360" }),
                },
                photos: {
                    "360x360": await this.getPhotos({ ...data, path: `${data.bananaId}/360` }),
                    "720x720": await this.getPhotos({ ...data, path: `${data.bananaId}/720` }),
                },
                videos: {
                    "360x360": await this.getVideos({ ...data, path: `${data.bananaId}/360` }),
                    "720x720": await this.getVideos({ ...data, path: `${data.bananaId}/720` }),
                },
            },
        };
    }

    /**
     * 取得個人照片
     * @param data
     * @returns
     */
    async getPhotos(data: { bananaId: string; gender: string; path: string; photos: [] }) {
        let files = [];
        const photos = [];
        if (data.photos.length > 0) {
            for (let i = 0; data.photos.length > i; i++) {
                try {
                    // 取得 php api 的圖片檔案路徑 判斷是否有圖
                    files = await glob.sync(`${this.phpStorageFolder}/user/photo/${data.path}/${data.photos[i]}.jpg`);
                    if (files.length > 0) {
                        photos.push({
                            id: data.photos[i],
                            // CDN 網址 加上 php laravel 專案路徑移除後，留下的剩餘路徑
                            url: `${this.cdnURL}${files[0].replace(this.phpStorageFolder, "")}?${moment(await this.getImgMtime(files[0])).valueOf()}`,
                            sorting: i,
                        });
                    }
                } catch (err) {
                    console.log("其他照片取得失敗", err);
                }
            }
            return photos;
        }
        return [];
    }

    /**
     * 取得影片封面照圖
     * @param data
     * @returns
     */
    async getVideos(data: { bananaId: string; gender: string; path: string; videos: [] }) {
        let files = [];
        const videos = [];
        if (data.videos.length > 0) {
            for (let i = 0; data.videos.length > i; i++) {
                try {
                    // 取得 php api 的圖片檔案路徑 判斷是否有圖
                    files = await glob.sync(`${this.phpStorageFolder}/user/video/${data.path}/${data.videos[i]}.mp4`);
                    const cover = await glob.sync(`${this.phpStorageFolder}/user/video/${data.path}/${data.videos[i]}.jpg`);
                    if (files.length > 0) {
                        const obj: any = {
                            id: data.videos[i],
                            // CDN 網址 加上 php laravel 專案路徑移除後，留下的剩餘路徑
                            url: `${this.cdnURL}${files[0].replace(this.phpStorageFolder, "")}?${moment(await this.getImgMtime(files[0])).valueOf()}`,
                            sorting: i,
                        };
                        if (cover.length > 0) {
                            obj.cover = `${this.cdnURL}${cover[0].replace(this.phpStorageFolder, "")}?${moment(
                                await this.getImgMtime(cover[0])
                            ).valueOf()}`;
                        } else {
                            obj.cover = null;
                        }

                        videos.push(obj);
                    }
                } catch (err) {
                    console.log("影片封面照取得失敗", err);
                }
            }
            return videos;
        }
        return [];
    }

    /**
     * 取得大頭照
     * @param data
     * @returns
     */
    async getAvatar(data: { bananaId: string; gender: string; path: string }) {
        let files = [];
        try {
            // 取得 php api 的圖片檔案路徑 判斷是否有圖
            files = await glob.sync(`${this.phpStorageFolder}/${data.path}/${data.bananaId}.jpg`);
            if (files.length > 0) {
                // CDN 網址 加上 php laravel 專案路徑移除後，留下的剩餘路徑
                return `${this.cdnURL}${files[0].replace(this.phpStorageFolder, "")}?${moment(await this.getImgMtime(files[0])).valueOf()}`;
            }
            try {
                const defImg = `${process.env.HOST}/img/users/avatar/${data.gender}_default.png`;
                return defImg;
            } catch (err) {
                console.log("大頭照取得失敗", err);
                return false;
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 取得檔案更新時間（用來更新 CDN 快取）
     * @param file
     * @returns
     */
    async getImgMtime(file) {
        try {
            const stats = fs.statSync(file);
            return stats.mtime;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * 對照可參與活動中 以選擇 或 未選擇 選項
     */
    async getEnableActivities(data: { enableActivitiesIds: []; customActivities: [string] }): Promise<any> {
        const activities: any[] = await this.activityRepository.findAll();
        const datas = activities.map((activity): { id: number; name: string; enabled: number } => {
            const enabled: number = data.enableActivitiesIds.findIndex((enableActivity) => enableActivity === activity.id) === -1 ? 0 : 1;
            return {
                id: activity.id,
                name: activity.name,
                enabled,
            };
        });
        return { acceptable_activities: { activities: sortBy(datas, ["id"]), custom_activities: data.customActivities } };
    }
}
