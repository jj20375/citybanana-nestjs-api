import { registerAs } from "@nestjs/config";

export default registerAs("socialOauth", () => ({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleSecret: process.env.GOOGLE_SECRET,
    lineProfileApi: process.env.LINE_PROFILE_API,
    lineVerifyAccessToken: process.env.LINE_VERIFY_ACCESS_TOKEN_API,
    lineFriendshipStatusApi: process.env.LINE_FRIENDSHIP_STATUS_API,
    appleKeysApi: process.env.APPLE_KEYS_API,
}));
