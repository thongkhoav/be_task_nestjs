// chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { SocketSecurityService } from './socket-security.service';
import { socketCors } from './socket-cors';

@WebSocketGateway({
  cors: socketCors,
})
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly socketSecurity: SocketSecurityService,
  ) {}

  afterInit(server: Server) {
    this.socketSecurity.install(server);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await this.socketSecurity.assertRoomMember(client, roomId);
    if (!client.rooms.has(roomId)) {
      await client.join(roomId);
    }

    const history = await this.chatService.getRoomMessages(roomId);
    client.emit('chatHistory', history);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await this.socketSecurity.assertRoomMember(client, roomId);
    await client.leave(roomId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    payload: {
      roomId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload.roomId || !payload.content?.trim()) {
      throw new WsException('Invalid message');
    }
    const userId = await this.socketSecurity.assertRoomMember(
      client,
      payload.roomId,
    );
    const msg = await this.chatService.saveMessage(
      payload.roomId,
      userId,
      payload.content,
    );

    this.server.to(payload.roomId).emit('newMessage', msg);
  }
}
