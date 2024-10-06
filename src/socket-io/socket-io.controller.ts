import { Controller, UseGuards, Get, Req, Res, HttpStatus } from "@nestjs/common";
import { SocketIoService } from "./socket-io.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Server } from "socket.io";

@Controller("socket-io")
export class SocketIoController {
    constructor(private readonly socketIoService: SocketIoService) {}
    @UseGuards(JwtAuthGuard)
    @Get("redis-sub")
    async run(@Req() req, @Res() res) {
        await this.socketIoService.subRedis(req.user.userId);
        return res.status(HttpStatus.OK).json({ succes: true });
    }
}
