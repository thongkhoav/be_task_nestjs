import { TaskGateway } from './task.gateway';

describe('TaskGateway authorization', () => {
  const taskService = {
    updateStatusTaskValidator: jest.fn(),
    updateStatusTask: jest.fn(),
  };
  const eventEmitter = {
    on: jest.fn(),
  };
  const socketSecurity = {
    install: jest.fn(),
    assertRoomMember: jest.fn(),
    getUserId: jest.fn(),
  };
  const server = {
    to: jest.fn(() => ({ emit: jest.fn() })),
  };

  let gateway: TaskGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new (TaskGateway as any)(
      taskService,
      eventEmitter,
      socketSecurity,
    );
    (gateway as any).server = server;
  });

  it('authorizes room membership before joining a task room', async () => {
    const client = { join: jest.fn() } as any;
    socketSecurity.assertRoomMember.mockResolvedValue('verified-user');

    await gateway.handleJoinRoom('room-1', client);

    expect(socketSecurity.assertRoomMember).toHaveBeenCalledWith(
      client,
      'room-1',
    );
    expect(client.join).toHaveBeenCalledWith('room-1');
  });

  it('derives task updater identity from the authenticated socket and validates the update', async () => {
    const client = { data: {} } as any;
    socketSecurity.getUserId.mockReturnValue('verified-user');
    taskService.updateStatusTask.mockResolvedValue({
      id: 'task-1',
      room: { id: 'room-1' },
    });
    const payload = {
      taskId: 'task-1',
      status: 'DONE',
      curUserId: 'spoofed-user',
    };

    await (gateway.handleTaskUpdate as any)(payload, client);

    const expectedUpdate = { taskId: 'task-1', status: 'DONE' };
    expect(taskService.updateStatusTaskValidator).toHaveBeenCalledWith(
      'verified-user',
      expectedUpdate,
    );
    expect(taskService.updateStatusTask).toHaveBeenCalledWith(
      'verified-user',
      expectedUpdate,
    );
  });
});
