// chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    if (client.rooms.has(roomId)) {
      console.log(`Client ${client.id} already in room ${roomId}`);
      return;
    }
    console.log(`Client ${client.id} joining room ${roomId}`);
    client.join(roomId);

    // Send chat history to the user who joined
    const history = await this.chatService.getRoomMessages(roomId);
    client.emit('chatHistory', history);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    console.log(`Client ${client.id} leaving room ${roomId}`);
    client.leave(roomId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    payload: {
      roomId: string;
      userId: string;
      content: string;
    },
  ) {
    console.log('Received message:', payload);
    const msg = await this.chatService.saveMessage(
      payload.roomId,
      payload.userId,
      payload.content,
    );

    // Broadcast new message to everyone in the room
    this.server.to(payload.roomId).emit('newMessage', msg);
  }
}
