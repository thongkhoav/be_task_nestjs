import { UnauthorizedException } from '@nestjs/common';
import { RoomService } from './room.service';

describe('RoomService authorization and relation safety', () => {
  const roomRepository = {
    findOne: jest.fn(),
  };
  const userRoomRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    softRemove: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const taskRepository = {
    update: jest.fn(),
  };
  const entityManager = {
    transaction: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };
  const notificationService = {
    sendNotificationAndSave: jest.fn(),
  };
  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  let service: RoomService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoomService(
      roomRepository as any,
      userRoomRepository as any,
      userRepository as any,
      taskRepository as any,
      entityManager as any,
      configService as any,
      notificationService as any,
      cacheManager as any,
    );
  });

  it('does not expose room member emails to a non-member requester', async () => {
    userRepository.findOne.mockResolvedValue({ id: 'requester-1' });
    userRoomRepository.findOne.mockResolvedValue(null);

    await expect(
      (service.getUserOfRoom as any)('requester-1', 'room-1', true),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userRoomRepository.find).not.toHaveBeenCalled();
  });

  it('loads user relations before removing all room members', async () => {
    userRoomRepository.find.mockResolvedValue([
      { id: 'membership-1', user: { id: 'member-1' } },
    ]);

    await service.removeMember('', 'room-1', true);

    expect(userRoomRepository.find).toHaveBeenCalledWith({
      where: { room: { id: 'room-1' }, isOwner: false },
      relations: ['user'],
    });
    expect(taskRepository.update).toHaveBeenCalledWith(
      { user: { id: 'member-1' }, room: { id: 'room-1' } },
      { user: null },
    );
  });
});
