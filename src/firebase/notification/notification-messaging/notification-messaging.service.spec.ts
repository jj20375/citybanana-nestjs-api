import { Test, TestingModule } from '@nestjs/testing';
import { NotificationMessagingService } from './notification-messaging.service';

describe('NotificationMessagingService', () => {
  let service: NotificationMessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationMessagingService],
    }).compile();

    service = module.get<NotificationMessagingService>(NotificationMessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
