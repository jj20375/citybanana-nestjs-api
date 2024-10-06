import { Test, TestingModule } from '@nestjs/testing';
import { MitakeSmsController } from './mitake-sms.controller';

describe('MitakeSmsController', () => {
  let controller: MitakeSmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MitakeSmsController],
    }).compile();

    controller = module.get<MitakeSmsController>(MitakeSmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
