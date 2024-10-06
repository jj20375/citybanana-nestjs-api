import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { EventEmitter2 } from "eventemitter2";

@Injectable()
export class OrderEventProducer {
    constructor(private readonly eventEmitter: EventEmitter2) {}
    async created(data) {
        this.eventEmitter.emit("order.created", data);
    }
}
