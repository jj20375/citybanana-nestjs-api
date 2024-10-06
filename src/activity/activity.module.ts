import { Module } from "@nestjs/common";
import { activitiesProviders } from "./activities.providers";
import { activitiesUserProviders } from "./activity-user.providers";
import { ActivityService } from "./activity.service";
import { ActivityRepository } from "./activity.repository";
import { ActivityUserRepository } from "./activity-user.repository";

@Module({
    providers: [ActivityService, ...activitiesProviders, ...activitiesUserProviders, ActivityRepository, ActivityUserRepository],
    exports: [ActivityRepository, ActivityUserRepository],
})
export class ActivityModule {}
