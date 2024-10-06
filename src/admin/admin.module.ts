import { Module } from "@nestjs/common";
import { AdministratorController } from "./users/administrator/administrator.controller";
import { AdministratorUserRepository } from "src/admin/users/administrator/administrator-user.repository";
import { administratorUsersProviders } from "src/admin/users/administrator/administrator-user.providers";
import { AdministratorService } from "./users/administrator/administrator.service";

@Module({
    controllers: [AdministratorController],
    providers: [AdministratorUserRepository, ...administratorUsersProviders, AdministratorService],
    exports: [AdministratorUserRepository, ...administratorUsersProviders, AdministratorService],
})
export class AdminModule {}
