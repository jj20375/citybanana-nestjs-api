import { Injectable, Logger } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";

import { UsersService } from "../users/users.service";
import { User } from "../users/user.interface";
import { UsersRepository } from "src/users/users.repository";

@Injectable()
export class AuthSerializer extends PassportSerializer {
    constructor(private readonly usersRepository: UsersRepository) {
        super();
    }
    serializeUser(user: User, done: (err: Error, user: { id: number; phone: string }) => void) {
        Logger.log(user, "user2");
        done(null, { id: user.id, phone: user.phone });
    }

    async deserializeUser(payload: { id: number; phone: string }, done: (err: Error, user: Omit<User, "password">) => void) {
        const user = await this.usersRepository.findOne({ column: "phone", value: payload.phone });
        done(null, user);
    }
    public passportInstance = this.getPassportInstance();
}
