import { Test, TestingModule } from '@nestjs/testing';
import { ChatFirestoreHelperService } from './chat-firestore-helper.service';

describe('ChatFirestoreHelperService', () => {
  let service: ChatFirestoreHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatFirestoreHelperService],
    }).compile();

    service = module.get<ChatFirestoreHelperService>(ChatFirestoreHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
