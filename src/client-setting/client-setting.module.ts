import { Module } from "@nestjs/common";
import { FirebaseInitApp } from "src/firebase/firebase-init.service";
import { ClientUiSettingService } from "src/firebase/client-ui-setting/client-ui-setting.service";
import { ClientSettingController } from "./client-setting.controller";
import { ClientSettingService } from "./client-setting.service";
@Module({
    providers: [FirebaseInitApp, ClientUiSettingService, ClientSettingService],
    controllers: [ClientSettingController],
})
export class ClientSettingModule {}
