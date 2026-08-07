import { RoomController } from './room.controller';

describe('RoomController member-list authorization', () => {
  it('passes the authenticated requester to the member-list service', async () => {
    const roomService = {
      getUserOfRoom: jest.fn().mockResolvedValue([]),
    };
    const controller = new RoomController(roomService as any);
    const request = { user: { id: 'requester-1' } };

    await (controller.getUserOfRoom as any)('room-1', 'true', request);

    expect(roomService.getUserOfRoom).toHaveBeenCalledWith(
      'requester-1',
      'room-1',
      true,
    );
  });
});
