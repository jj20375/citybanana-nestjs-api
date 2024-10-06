import { Sequelize } from "sequelize-typescript";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "src/users/user.entity";
import { UserDevice } from "src/users/user-device.entity";
import { GoogleUser } from "src/users/google/google-user.entity";
import { FacebookUser } from "src/users/facebook/facebook-user.entity";
import { LineUser } from "src/users/line/line-user.entity";
import { AppleUser } from "src/users/apple/apple-user.entity";
import { UserFeedback } from "src/users/userFeedback/userFeedback.entity";
import { Order } from "src/order/order.entity";
import { Activity } from "src/activity/activities.entity";
import { AdministratorUser } from "src/admin/users/administrator/administrator-user.entity";
import { ActivityUser } from "src/activity/activity-user.entity";
import { Badge } from "src/badges/badge.entity";
import { BadgeUser } from "src/badges/badge-user.entity";
import { Authentication } from "src/authentication/authentication.entity";
import { Report } from "src/report/report.entity";
import { CreditCard } from "src/credit-card/credit-card.entity";
import { TransactionLogs } from "src/transaction-logs/transaction-logs.entity";
import { PlatformLogs } from "src/platform-logs/platform-logs.entity";
import { Payments } from "src/payments/payments.entity";
import { ShortMessageLogs } from "src/short-message-logs/short-message-logs.entity";
import { Blacklist } from "src/blacklist/blacklist.entity";
import { Category } from "src/categories/categories.entity";
import { CategoryUser } from "src/categories/category-user/category-user.entity";
import { BusinessHours } from "src/business/business-hours/business-hours.entity";
import { NonBusinessHours } from "src/business/non-business-hours/non-business-hours.entity";
import { WeeklyBusinessHours } from "src/business/weekly-business-hours/weekly-business-hours.entity";
import { DatingDemands } from "src/demands/dating-demands/dating-demands.entity";
import { DatingDemandEnrollers } from "src/demands/dating-demands-enrollers/dating-demands-enrollers.entity";
import { Campaigns } from "src/campaigns/campaigns.entity";
import { Vouchers } from "src/vouchers/vouchers.entity";
import { VoucherLogs } from "src/voucher-logs/voucher-logs.entity";
import { InvitationCode } from "src/invitation-code/invitation-code.entity";
import { Promoters } from "src/promoters/promoters.entity";
export const databaseProviders = [
    {
        provide: "SEQUELIZE",
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
            const sequelize = new Sequelize({
                dialect: configService.get("sqldb.connection"),
                host: configService.get("sqldb.host"),
                port: configService.get("sqldb.port"),
                username: configService.get("sqldb.username"),
                password: configService.get("sqldb.password"),
                database: configService.get("sqldb.database"),
                define: {
                    // timestamps: false,
                },
            });

            sequelize.addModels([
                Report,
                AdministratorUser,
                ActivityUser,
                Activity,
                Authentication,
                User,
                UserDevice,
                GoogleUser,
                FacebookUser,
                LineUser,
                AppleUser,
                UserFeedback,
                Order,
                Badge,
                BadgeUser,
                CreditCard,
                TransactionLogs,
                PlatformLogs,
                Payments,
                ShortMessageLogs,
                Blacklist,
                Category,
                CategoryUser,
                BusinessHours,
                NonBusinessHours,
                WeeklyBusinessHours,
                DatingDemands,
                DatingDemandEnrollers,
                Campaigns,
                Vouchers,
                VoucherLogs,
                InvitationCode,
                Promoters,
            ]);

            await sequelize.sync();
            return sequelize;
        },
        inject: [ConfigService],
    },
];
