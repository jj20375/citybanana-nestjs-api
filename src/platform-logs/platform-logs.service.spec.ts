import { Test, TestingModule } from '@nestjs/testing';
import { PlatformLogsService } from './platform-logs.service';

describe('PlatformLogsService', () => {
  let service: PlatformLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformLogsService],
    }).compile();

    service = module.get<PlatformLogsService>(PlatformLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
