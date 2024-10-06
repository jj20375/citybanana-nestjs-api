import { Module } from "@nestjs/common";
import { categoryUserProviders } from "../category-user/category-user.providers";
import { CategoryUserRepository } from "./categroy-user.repository";

@Module({
    providers: [...categoryUserProviders, CategoryUserRepository],
})
export class CategoryUserModule {}
