import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLogsService } from './transaction-logs.service';

describe('TransactionLogsService', () => {
  let service: TransactionLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionLogsService],
    }).compile();

    service = module.get<TransactionLogsService>(TransactionLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
