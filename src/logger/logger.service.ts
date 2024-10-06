import { Injectable, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
@Injectable()
export class LoggerService {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

    warn(message): void {
        this.logger.warn(message);
    }

    error(message): void {
        this.logger.error(message);
    }

    debug(message): void {
        this.logger.debug(message);
    }

    info(message): void {
        this.logger.info(message);
    }

    http(message): void {
        this.logger.http(message);
    }
}
