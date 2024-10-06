import { registerAs } from "@nestjs/config";

export default registerAs("socket", () => ({
    socketio_port: process.env.SOCKETIO_PORT,
}));
