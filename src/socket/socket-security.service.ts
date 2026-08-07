import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { RoomService } from 'src/room/room.service';

type AuthenticatedSocketData = {
  authUser?: {
    id: string;
    exp: number;
  };
};

@Injectable()
export class SocketSecurityService {
  private readonly installedServers = new WeakSet<Server>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
  ) {}

  install(server: Server): void {
    if (this.installedServers.has(server)) return;

    server.use((client, next) => {
      void this.authenticate(client, next);
    });
    this.installedServers.add(server);
  }

  async authenticate(
    client: Socket,
    next: (error?: Error) => void,
  ): Promise<void> {
    try {
      const cookieName = this.configService.get<string>(
        'COOKIE_AUTH',
        'TaskApp_Tokens',
      );
      const rawCookie = this.readCookie(
        client.handshake.headers.cookie,
        cookieName,
      );
      if (!rawCookie) throw new Error('Missing authentication cookie');

      const tokens = JSON.parse(rawCookie) as { access_token?: string };
      if (!tokens.access_token) throw new Error('Missing access token');

      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
        exp?: number;
      }>(tokens.access_token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });
      if (!payload.sub || !payload.exp) throw new Error('Invalid access token');

      const user = await this.authService.getUserById(payload.sub);
      if (!user) throw new Error('User not found');

      (client.data as AuthenticatedSocketData).authUser = {
        id: user.id,
        exp: payload.exp,
      };
      this.disconnectAtTokenExpiry(client, payload.exp);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  }

  getUserId(client: Socket): string {
    const authUser = (client.data as AuthenticatedSocketData).authUser;
    if (!authUser || authUser.exp * 1000 <= Date.now()) {
      throw new WsException('Unauthorized');
    }
    return authUser.id;
  }

  async assertRoomMember(client: Socket, roomId: string): Promise<string> {
    const userId = this.getUserId(client);
    if (!roomId || !(await this.roomService.isRoomMemberById(roomId, userId))) {
      throw new WsException('You are not a member of this room');
    }
    return userId;
  }

  private readCookie(cookieHeader: string | undefined, name: string): string {
    if (!cookieHeader) return null;

    for (const part of cookieHeader.split(';')) {
      const separator = part.indexOf('=');
      if (separator < 0) continue;

      const cookieName = part.slice(0, separator).trim();
      if (cookieName !== name) continue;

      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
    return null;
  }

  private disconnectAtTokenExpiry(client: Socket, expiresAt: number): void {
    const delayMs = expiresAt * 1000 - Date.now();
    if (delayMs <= 0) {
      client.disconnect(true);
      return;
    }

    const expiryTimer = setTimeout(() => client.disconnect(true), delayMs);
    expiryTimer.unref();
    client.once('disconnect', () => clearTimeout(expiryTimer));
  }
}
