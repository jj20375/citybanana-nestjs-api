import { Module } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { campaignsProviders } from "./campaigns.providers";
import { CampaignsRepository } from "./campaigns.repository";

@Module({
    providers: [CampaignsService, ...campaignsProviders, CampaignsRepository],
})
export class CampaignsModule {}
