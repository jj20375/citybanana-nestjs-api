import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { urlencoded } from "express";
@Injectable()
export class GoogleMapService {
    constructor(private http: HttpService) {}

    /**
     * 輸入搜尋關鍵字 自動顯示相關對應地點
     * @param data
     * @returns
     */
    async autocomplete(data: { value: string }) {
        const encoded = encodeURI(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${data.value}&language=zh_TW&key=${process.env.GOOGLE_MAP_KEY}&components=country:tw`
        );
        try {
            const res = await this.http.get(`${encoded}`).toPromise();
            return res.data;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得地圖資料失敗",
                    error: {
                        error: "n9001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * 取得經緯度 api
     * @param value 地址
     */
    async getLatLng(data: { value: string }) {
        /**
         * 使用 place_id 取得經緯度
         const encoded = encodeURI(
             `https://maps.googleapis.com/maps/api/geocode/json?place_id=ChIJhwLjy1-haDQR8eRjHJiqUM0&language=zh_TW&key=${process.env.GOOGLE_MAP_KEY}`
         */
        // );
        /**
         * 使用 地址 取得經緯度
         */
        const encoded = encodeURI(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${data.value}&language=zh_TW&key=${process.env.GOOGLE_MAP_KEY}`
        );
        try {
            const res = await this.http.get(`${encoded}`).toPromise();
            return res.data;
        } catch (err) {
            console.log(err);
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "取得地圖資料失敗",
                    error: {
                        error: "n9001",
                        msg: JSON.stringify(err),
                    },
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
