import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMapController } from './google-map.controller';

describe('GoogleMapController', () => {
  let controller: GoogleMapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleMapController],
    }).compile();

    controller = module.get<GoogleMapController>(GoogleMapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
