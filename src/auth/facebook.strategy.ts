import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-facebook";
import FacebookTokenStrategy from "passport-facebook-token";
import { IFacebookUserInfo } from "src/users/facebook/facebook-user.interface";
@Injectable()
export class FacebookStrategy extends PassportStrategy(FacebookTokenStrategy, "facebook") {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_SECRET,
            graphAPIVersion: process.env.FACEBOOK_DEFAULT_GRAPH_VERSION,
            callbackURL: "http://localhost:3000/",
            scope: ["email", "profile"],
            profileFields: ["emails", "name", "id", "photos"],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: any, user: any, info?: any) => void): Promise<any> {
        try {
            // console.log(profile._json);
            const payload: IFacebookUserInfo = profile._json;

            done(null, payload);
        } catch (err) {
            console.log(err);
            done(err, false);
        }
    }
}
