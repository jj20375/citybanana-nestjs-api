import { Test, TestingModule } from '@nestjs/testing';
import { PromotersService } from './promoters.service';

describe('PromotersService', () => {
  let service: PromotersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromotersService],
    }).compile();

    service = module.get<PromotersService>(PromotersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
