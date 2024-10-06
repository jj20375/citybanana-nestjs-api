import { Injectable } from "@nestjs/common";
import { AuthenticationRepository } from "./authentication.repostiory";

@Injectable()
export class AuthenticationService {
    constructor(private readonly authenticationRepository: AuthenticationRepository) {}
}
