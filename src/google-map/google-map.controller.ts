import { Body, Controller, Get, Post, HttpException, HttpStatus, Res } from "@nestjs/common";
import { GoogleMapService } from "./google-map.service";
import { GoogleMapSearchDto } from "./dto/google-map-searchDto.dto";

@Controller("google-map")
export class GoogleMapController {
    constructor(private readonly mapService: GoogleMapService) {}

    /**
     * 輸入搜尋關鍵字 自動顯示相關對應地點 api
     * @param body
     * @param res
     * @returns
     */
    @Post("autocomplete")
    async autocomplete(@Body() body: GoogleMapSearchDto, @Res() res) {
        try {
            const data = await this.mapService.autocomplete(body);
            return res.status(HttpStatus.OK).json(data);
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
     * @param body
     * @param res
     * @returns
     */
    @Post("lat-lng")
    async showLatLng(@Body() body: GoogleMapSearchDto, @Res() res) {
        try {
            const { results } = await this.mapService.getLatLng(body);
            const data = { ...results }["0"];
            return res.status(HttpStatus.OK).json(data.geometry);
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
