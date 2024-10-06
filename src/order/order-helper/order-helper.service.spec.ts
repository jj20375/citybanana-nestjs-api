import { Test, TestingModule } from '@nestjs/testing';
import { OrderHelperService } from './order-helper.service';

describe('OrderHelperService', () => {
  let service: OrderHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderHelperService],
    }).compile();

    service = module.get<OrderHelperService>(OrderHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
