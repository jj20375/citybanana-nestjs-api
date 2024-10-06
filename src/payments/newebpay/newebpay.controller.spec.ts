import { Test, TestingModule } from '@nestjs/testing';
import { NewebpayController } from './newebpay.controller';

describe('NewebpayController', () => {
  let controller: NewebpayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewebpayController],
    }).compile();

    controller = module.get<NewebpayController>(NewebpayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
