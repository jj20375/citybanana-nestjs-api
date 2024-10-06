import { Test, TestingModule } from '@nestjs/testing';
import { ShortMessageLogsService } from './short-message-logs.service';

describe('ShortMessageLogsService', () => {
  let service: ShortMessageLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShortMessageLogsService],
    }).compile();

    service = module.get<ShortMessageLogsService>(ShortMessageLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
