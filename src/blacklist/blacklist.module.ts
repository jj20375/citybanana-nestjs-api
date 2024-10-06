import { Module } from "@nestjs/common";
import { BlacklistService } from "./blacklist.service";
import { blacklistProviders } from "./blacklist.providers";
import { Blacklist } from "./blacklist.entity";

@Module({
    providers: [BlacklistService, /*...blacklistProviders*/ { provide: "BLACKLIST_REPOSITORY", useValue: Blacklist }],
})
export class BlacklistModule {}
