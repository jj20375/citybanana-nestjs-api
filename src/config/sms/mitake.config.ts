import { registerAs } from "@nestjs/config";

export default registerAs("mitake-sms", () => ({
    apiConfig: process.env.MITAKE_SMS_API_CONFIG,
    username: process.env.MITAKE_SMS_USERNAME,
    password: process.env.MITAKE_SMS_PASSWORD,
}));
