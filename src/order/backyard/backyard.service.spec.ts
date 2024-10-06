import { Test, TestingModule } from "@nestjs/testing";
import { OrderBackyardService } from "./backyard.service";

describe("OrderBackyardService", () => {
    let service: BackyardService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BackyardService],
        }).compile();

        service = module.get<OrderBackyardService>(BackyardService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
