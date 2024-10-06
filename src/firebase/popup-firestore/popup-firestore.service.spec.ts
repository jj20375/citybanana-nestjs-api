import { Test, TestingModule } from '@nestjs/testing';
import { PopupFirestoreService } from './popup-firestore.service';

describe('PopupFirestoreService', () => {
  let service: PopupFirestoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PopupFirestoreService],
    }).compile();

    service = module.get<PopupFirestoreService>(PopupFirestoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
