import { Test, TestingModule } from '@nestjs/testing';
import { VorderFirestoreService } from './vorder-firestore.service';

describe('VorderFirestoreService', () => {
  let service: VorderFirestoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VorderFirestoreService],
    }).compile();

    service = module.get<VorderFirestoreService>(VorderFirestoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
