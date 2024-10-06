import { CategoryUser } from "./category-user.entity";

export const categoryUserProviders = [
    {
        provide: "CATEGORY_USER_REPOSITORY",
        useValue: CategoryUser,
    },
];
