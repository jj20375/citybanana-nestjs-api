import { Module } from "@nestjs/common";
import { businessHoursProviders } from "./business-hours.providers";

@Module({
    providers: [...businessHoursProviders],
})
export class BusinessHoursModule {}
