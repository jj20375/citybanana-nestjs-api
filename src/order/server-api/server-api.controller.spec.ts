import { Test, TestingModule } from "@nestjs/testing";
import { OrderServerApiController } from "./server-api.controller";

describe("OrderServerApiController", () => {
    let controller: OrderServerApiController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrderServerApiController],
        }).compile();

        controller = module.get<OrderServerApiController>(OrderServerApiController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
