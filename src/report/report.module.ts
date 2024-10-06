import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { reportProviders } from "./report.providers";
import { orderProviders } from "src/order/order.providers";
import { userFeedbackProviders } from "src/users/userFeedback/userFeedbackProviders";
import { ReportHelperService } from "src/report/report-helper.service";

@Module({
    providers: [ReportService, ...reportProviders, ...orderProviders, ReportHelperService, ...userFeedbackProviders],
    exports: [...reportProviders, ...orderProviders, ReportHelperService, ...userFeedbackProviders],
    controllers: [ReportController],
})
export class ReportModule {}
