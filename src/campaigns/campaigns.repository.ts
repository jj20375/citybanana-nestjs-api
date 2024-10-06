import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { Campaigns } from "./campaigns.entity";

@Injectable()
export class CampaignsRepository {
    constructor(
        @Inject("CAMPAIGNS_REPOSITORY")
        private campaignsRepository: typeof Campaigns
    ) {}
}
