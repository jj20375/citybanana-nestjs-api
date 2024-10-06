import { Test, TestingModule } from '@nestjs/testing';
import { PopupFirestoreHelperService } from './popup-firestore-helper.service';

describe('PopupFirestoreHelperService', () => {
  let service: PopupFirestoreHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PopupFirestoreHelperService],
    }).compile();

    service = module.get<PopupFirestoreHelperService>(PopupFirestoreHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
