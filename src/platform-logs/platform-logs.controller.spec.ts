import { Test, TestingModule } from '@nestjs/testing';
import { PlatformLogsController } from './platform-logs.controller';

describe('PlatformLogsController', () => {
  let controller: PlatformLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformLogsController],
    }).compile();

    controller = module.get<PlatformLogsController>(PlatformLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
