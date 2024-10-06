import { Test, TestingModule } from '@nestjs/testing';
import { ChatRealtimeHelperService } from './chat-realtime-helper.service';

describe('ChatRealtimeHelperService', () => {
  let service: ChatRealtimeHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatRealtimeHelperService],
    }).compile();

    service = module.get<ChatRealtimeHelperService>(ChatRealtimeHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
