import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";

@Injectable()
export class RegisterProducer {
    constructor(@InjectQueue("register-queue") private queue: Queue) {}

    async setFirestoreData(data: any) {
        await this.queue.add(
            "register-job",
            {
                data,
            },
            { delay: 1000 }
        );
    }
}
