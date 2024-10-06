import { Test, TestingModule } from '@nestjs/testing';
import { InvitationCodeController } from './invitation-code.controller';

describe('InvitationCodeController', () => {
  let controller: InvitationCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationCodeController],
    }).compile();

    controller = module.get<InvitationCodeController>(InvitationCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
