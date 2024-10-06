import { Test, TestingModule } from '@nestjs/testing';
import { ServerApiController } from './server-api.controller';

describe('ServerApiController', () => {
  let controller: ServerApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerApiController],
    }).compile();

    controller = module.get<ServerApiController>(ServerApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
