import { Test, TestingModule } from '@nestjs/testing';
import { ClientSettingController } from './client-setting.controller';

describe('ClientSettingController', () => {
  let controller: ClientSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientSettingController],
    }).compile();

    controller = module.get<ClientSettingController>(ClientSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
