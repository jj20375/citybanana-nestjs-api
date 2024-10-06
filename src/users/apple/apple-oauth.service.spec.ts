import { Test, TestingModule } from "@nestjs/testing";
import { AppleOauthService } from "./apple-oauth.service";

describe("AppleOauthService", () => {
    let service: AppleOauthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AppleOauthService],
        }).compile();

        service = module.get<AppleOauthService>(AppleOauthService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
