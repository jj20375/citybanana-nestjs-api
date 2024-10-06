import { Module } from "@nestjs/common";
import { PromotersService } from "./promoters.service";
import { promtersProviders } from "./promoters.providers";
import { PromotersRepository } from "./promoters.repository";

@Module({
    providers: [PromotersService, ...promtersProviders, PromotersRepository],
    exports: [...promtersProviders, PromotersRepository],
})
export class PromotersModule {}
