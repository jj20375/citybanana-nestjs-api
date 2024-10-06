import { Test, TestingModule } from "@nestjs/testing";
import { LineUserBotController } from "./line-user-bot.controller";

describe("LineUserBotController", () => {
    let controller: LineUserBotController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LineUserBotController],
        }).compile();

        controller = module.get<LineUserBotController>(LineUserBotController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
