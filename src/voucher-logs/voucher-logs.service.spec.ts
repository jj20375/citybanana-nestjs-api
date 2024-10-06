import { Test, TestingModule } from '@nestjs/testing';
import { VoucherLogsService } from './voucher-logs.service';

describe('VoucherLogsService', () => {
  let service: VoucherLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoucherLogsService],
    }).compile();

    service = module.get<VoucherLogsService>(VoucherLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
