import { Test, TestingModule } from '@nestjs/testing';
import { MitakeSmsService } from './mitake-sms.service';

describe('MitakeSmsService', () => {
  let service: MitakeSmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MitakeSmsService],
    }).compile();

    service = module.get<MitakeSmsService>(MitakeSmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
