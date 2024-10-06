import { Module } from "@nestjs/common";
import { InvitationCodeService } from "./invitation-code.service";
import { InvitationCodeController } from "./invitation-code.controller";
import { ServerApiController } from "./server-api/server-api.controller";
import { invitationProviders } from "./invitation-code.providers";
import { InvitationCodeRepository } from "./invitation-code.repository";
import { PromotersModule } from "src/promoters/promoters.module";
import { LoggerService } from "src/logger/logger.service";
@Module({
    imports: [PromotersModule],
    providers: [InvitationCodeService, ...invitationProviders, InvitationCodeRepository, LoggerService],
    exports: [InvitationCodeService, ...invitationProviders, InvitationCodeRepository, LoggerService],
    controllers: [InvitationCodeController, ServerApiController],
})
export class InvitationCodeModule {}
