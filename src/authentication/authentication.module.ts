import { Module } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { AuthenticationController } from "./authentication.controller";
import { authenticationProviders } from "./authentication.providers";
import { AuthenticationRepository } from "./authentication.repostiory";
@Module({
    providers: [AuthenticationService, ...authenticationProviders, AuthenticationRepository],
    controllers: [AuthenticationController],
})
export class AuthenticationModule {}
