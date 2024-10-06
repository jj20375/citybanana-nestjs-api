import { Test, TestingModule } from '@nestjs/testing';
import { NotificationMessagingHelperService } from './notification-messaging-helper.service';

describe('NotificationMessagingHelperService', () => {
  let service: NotificationMessagingHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationMessagingHelperService],
    }).compile();

    service = module.get<NotificationMessagingHelperService>(NotificationMessagingHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
