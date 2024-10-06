import { Test, TestingModule } from '@nestjs/testing';
import { BackyardController } from './backyard.controller';

describe('BackyardController', () => {
  let controller: BackyardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackyardController],
    }).compile();

    controller = module.get<BackyardController>(BackyardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
