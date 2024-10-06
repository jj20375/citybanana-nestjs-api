import { Test, TestingModule } from '@nestjs/testing';
import { DatingDemandsService } from './dating-demands.service';

describe('DatingDemandsService', () => {
  let service: DatingDemandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatingDemandsService],
    }).compile();

    service = module.get<DatingDemandsService>(DatingDemandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
