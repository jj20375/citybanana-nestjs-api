import { Injectable } from "@nestjs/common";
import { ClientUiSettingService } from "src/firebase/client-ui-setting/client-ui-setting.service";
@Injectable()
export class ClientSettingService {
    constructor(private clientUiSwitchService: ClientUiSettingService) {}
    /**
     * 取得前台 ui 顯示設定檔
     */
    async getUiSetting() {
        const result = await this.clientUiSwitchService.getClientUiSetting();
        return result;
    }
}
