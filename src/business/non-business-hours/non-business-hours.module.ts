import { Module } from "@nestjs/common";
import { nonBusinessHoursProviders } from "./non-business-hours.providers";

@Module({
    providers: [...nonBusinessHoursProviders],
})
export class NonBusinessHoursModule {}
