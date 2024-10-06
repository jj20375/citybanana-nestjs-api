import { Module } from "@nestjs/common";
import { CategoryUserModule } from "./category-user/category-user.module";
import { categoryProviders } from "./categories.providers";
import { CategoryRepository } from "./categories.repository";

@Module({
    imports: [CategoryUserModule],
    providers: [...categoryProviders, CategoryRepository],
})
export class CategoriesModule {}
