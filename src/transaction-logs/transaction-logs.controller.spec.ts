import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLogsController } from './transaction-logs.controller';

describe('TransactionLogsController', () => {
  let controller: TransactionLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionLogsController],
    }).compile();

    controller = module.get<TransactionLogsController>(TransactionLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
