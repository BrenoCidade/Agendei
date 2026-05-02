import type { INotificationGateway, NotificationPayload } from '@/domain/gateways/INotificationGateway';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface JwtPayload {
  sub: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = process.env.FRONTEND_URL || 'http://localhost:8080';
      if (!origin || origin === allowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, INotificationGateway
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  private readonly providerSockets = new Map<string, Set<string>>();
  private readonly socketToProvider = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const providerId = this.socketToProvider.get(client.id);
    if (providerId) {
      this.providerSockets.get(providerId)?.delete(client.id);
      this.socketToProvider.delete(client.id);
      this.logger.debug(`Provider ${providerId} disconnected socket ${client.id}`);
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(client: Socket, token: string): void {
    try {
      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      const providerId = payload.sub;

      if (!this.providerSockets.has(providerId)) {
        this.providerSockets.set(providerId, new Set());
      }

      this.providerSockets.get(providerId)!.add(client.id);
      this.socketToProvider.set(client.id, providerId);

      client.emit('authenticated', { providerId });
      this.logger.debug(`Provider ${providerId} authenticated via socket ${client.id}`);
    } catch {
      client.emit('auth_error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  notifyProvider(providerId: string, payload: NotificationPayload): void {
    const socketIds = this.providerSockets.get(providerId);
    if (!socketIds?.size) return;

    for (const socketId of socketIds) {
      this.server.to(socketId).emit(payload.type, payload);
    }
  }
}
