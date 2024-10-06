import { Module } from "@nestjs/common";
import { datingDemandEnrollersProviders } from "./dating-demands-enrollers.providers";

@Module({
    providers: [...datingDemandEnrollersProviders],
})
export class DatingDemandsEnrollersModule {}
