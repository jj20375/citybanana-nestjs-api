import { registerAs } from "@nestjs/config";

export default registerAs("secrets", () => ({
    jwt_secret: process.env.JWT_SECRET,
    jwt_algo: process.env.JWT_ALGO,
}));
