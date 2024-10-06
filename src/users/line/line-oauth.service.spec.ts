import { Test, TestingModule } from "@nestjs/testing";
import { LineOauthService } from "./line-oauth.service";

describe("LineOauthService", () => {
    let service: LineOauthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LineOauthService],
        }).compile();

        service = module.get<LineOauthService>(LineOauthService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
