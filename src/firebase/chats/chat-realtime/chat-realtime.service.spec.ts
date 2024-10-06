import { Test, TestingModule } from '@nestjs/testing';
import { ChatRealtimeService } from './chat-realtime.service';

describe('ChatRealtimeService', () => {
  let service: ChatRealtimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatRealtimeService],
    }).compile();

    service = module.get<ChatRealtimeService>(ChatRealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
