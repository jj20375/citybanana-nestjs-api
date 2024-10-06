import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class OrderEventConsumer {
    @OnEvent("order.created", { async: true })
    async onCreated(payload) {
        console.log(payload, "fuck");
    }
}
