import { WsException } from '@nestjs/websockets';
import { SocketSecurityService } from './socket-security.service';

describe('SocketSecurityService', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string, fallback?: string) => {
      const values = {
        COOKIE_AUTH: 'TaskApp_Tokens',
        ACCESS_TOKEN_SECRET: 'access-secret',
      };
      return values[key] ?? fallback;
    }),
  };
  const authService = {
    getUserById: jest.fn(),
  };
  const roomService = {
    isRoomMemberById: jest.fn(),
  };

  let service: SocketSecurityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SocketSecurityService(
      jwtService as any,
      configService as any,
      authService as any,
      roomService as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects a handshake without the authentication cookie', async () => {
    const client = { handshake: { headers: {} }, data: {} } as any;
    const next = jest.fn();

    await service.authenticate(client, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('stores only verified identity in socket data', async () => {
    const tokens = {
      access_token: 'verified-access-token',
      refresh_token: 'never-exposed-to-events',
    };
    const client = {
      handshake: {
        headers: {
          cookie: `TaskApp_Tokens=${encodeURIComponent(
            JSON.stringify(tokens),
          )}`,
        },
      },
      data: {},
      disconnect: jest.fn(),
      once: jest.fn(),
    } as any;
    const next = jest.fn();
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', exp: expiresAt });
    authService.getUserById.mockResolvedValue({ id: 'user-1' });

    await service.authenticate(client, next);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'verified-access-token',
      { secret: 'access-secret' },
    );
    expect(client.data.authUser).toEqual({ id: 'user-1', exp: expiresAt });
    expect(next).toHaveBeenCalledWith();
  });

  it('disconnects an authenticated socket when its access token expires', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-07T00:00:00.000Z'));
    const tokens = {
      access_token: 'verified-access-token',
      refresh_token: 'refresh-token',
    };
    const client = {
      handshake: {
        headers: {
          cookie: `TaskApp_Tokens=${encodeURIComponent(
            JSON.stringify(tokens),
          )}`,
        },
      },
      data: {},
      disconnect: jest.fn(),
      once: jest.fn(),
    } as any;
    const next = jest.fn();
    const expiresAt = Math.floor(Date.now() / 1000) + 1;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', exp: expiresAt });
    authService.getUserById.mockResolvedValue({ id: 'user-1' });

    await service.authenticate(client, next);
    jest.advanceTimersByTime(1_000);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects room events from authenticated non-members', async () => {
    const client = {
      data: {
        authUser: {
          id: 'user-1',
          exp: Math.floor(Date.now() / 1000) + 300,
        },
      },
    } as any;
    roomService.isRoomMemberById.mockResolvedValue(false);

    await expect(
      service.assertRoomMember(client, 'room-2'),
    ).rejects.toBeInstanceOf(WsException);
  });
});
