import { Test, TestingModule } from '@nestjs/testing';
import { NotificationFirestoreHelperService } from './notification-firestore-helper.service';

describe('NotificationFirestoreHelperService', () => {
  let service: NotificationFirestoreHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationFirestoreHelperService],
    }).compile();

    service = module.get<NotificationFirestoreHelperService>(NotificationFirestoreHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
