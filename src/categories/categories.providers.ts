import { Category } from "./categories.entity";

export const categoryProviders = [
    {
        provide: "CATEGORY_REPOSITORY",
        useValue: Category,
    },
];
