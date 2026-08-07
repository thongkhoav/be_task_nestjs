import { ChatGateway } from './chat.gateway';

describe('ChatGateway authorization', () => {
  const chatService = {
    getRoomMessages: jest.fn(),
    saveMessage: jest.fn(),
  };
  const socketSecurity = {
    install: jest.fn(),
    assertRoomMember: jest.fn(),
  };
  const server = {
    to: jest.fn(() => ({ emit: jest.fn() })),
  };

  let gateway: ChatGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new (ChatGateway as any)(chatService, socketSecurity);
    (gateway as any).server = server;
  });

  it('does not expose chat history until room membership is authorized', async () => {
    const client = {
      rooms: new Set<string>(),
      join: jest.fn(),
      emit: jest.fn(),
    } as any;
    socketSecurity.assertRoomMember.mockResolvedValue('verified-user');
    chatService.getRoomMessages.mockResolvedValue([{ id: 'message-1' }]);

    await gateway.handleJoinRoom(client, 'room-1');

    expect(socketSecurity.assertRoomMember).toHaveBeenCalledWith(
      client,
      'room-1',
    );
    expect(client.emit).toHaveBeenCalledWith('chatHistory', [
      { id: 'message-1' },
    ]);
  });

  it('loads chat history when the shared socket already joined the task room', async () => {
    const client = {
      rooms: new Set<string>(['room-1']),
      join: jest.fn(),
      emit: jest.fn(),
    } as any;
    socketSecurity.assertRoomMember.mockResolvedValue('verified-user');
    chatService.getRoomMessages.mockResolvedValue([{ id: 'message-1' }]);

    await gateway.handleJoinRoom(client, 'room-1');

    expect(client.join).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('chatHistory', [
      { id: 'message-1' },
    ]);
  });

  it('uses verified socket identity instead of a client-provided sender ID', async () => {
    const client = { data: {} } as any;
    socketSecurity.assertRoomMember.mockResolvedValue('verified-user');
    chatService.saveMessage.mockResolvedValue({ id: 'message-1' });
    const payload = {
      roomId: 'room-1',
      userId: 'spoofed-user',
      content: 'hello',
    };

    await (gateway.handleSendMessage as any)(payload, client);

    expect(socketSecurity.assertRoomMember).toHaveBeenCalledWith(
      client,
      'room-1',
    );
    expect(chatService.saveMessage).toHaveBeenCalledWith(
      'room-1',
      'verified-user',
      'hello',
    );
  });
});
