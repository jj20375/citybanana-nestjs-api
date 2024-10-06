import { Test, TestingModule } from '@nestjs/testing';
import { VorderFirestoreHelperService } from './vorder-firestore-helper.service';

describe('VorderFirestoreHelperService', () => {
  let service: VorderFirestoreHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VorderFirestoreHelperService],
    }).compile();

    service = module.get<VorderFirestoreHelperService>(VorderFirestoreHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
