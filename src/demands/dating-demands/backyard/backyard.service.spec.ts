import { Test, TestingModule } from "@nestjs/testing";
import { DemandsBackyardService } from "./backyard.service";

describe("DemandsBackyardService", () => {
    let service: DemandsBackyardService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DemandsBackyardService],
        }).compile();

        service = module.get<DemandsBackyardService>(DemandsBackyardService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
