import { Test, TestingModule } from '@nestjs/testing';
import { ClientSettingService } from './client-setting.service';

describe('ClientSettingService', () => {
  let service: ClientSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientSettingService],
    }).compile();

    service = module.get<ClientSettingService>(ClientSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
