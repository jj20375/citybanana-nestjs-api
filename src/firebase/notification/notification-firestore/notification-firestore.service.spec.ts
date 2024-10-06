import { Test, TestingModule } from '@nestjs/testing';
import { NotificationFirestoreService } from './notification-firestore.service';

describe('NotificationFirestoreService', () => {
  let service: NotificationFirestoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationFirestoreService],
    }).compile();

    service = module.get<NotificationFirestoreService>(NotificationFirestoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
