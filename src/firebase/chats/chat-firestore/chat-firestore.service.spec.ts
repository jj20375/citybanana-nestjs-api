import { Test, TestingModule } from '@nestjs/testing';
import { ChatFirestoreService } from './chat-firestore.service';

describe('ChatFirestoreService', () => {
  let service: ChatFirestoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatFirestoreService],
    }).compile();

    service = module.get<ChatFirestoreService>(ChatFirestoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
