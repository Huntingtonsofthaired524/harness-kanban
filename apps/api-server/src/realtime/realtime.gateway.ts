import { Injectable } from '@nestjs/common'
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import {
  REALTIME_SOCKET_EVENTS,
  REALTIME_SOCKET_NAMESPACE,
  RealtimeInboundEventPayload,
  RealtimeJoinRoomPayload,
} from '@repo/shared'
import { RealtimeService } from './realtime.service'
import type { Server, Socket } from 'socket.io'

@Injectable()
@WebSocketGateway({
  namespace: REALTIME_SOCKET_NAMESPACE,
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  private server!: Server

  constructor(private readonly realtimeService: RealtimeService) {}

  afterInit(): void {
    this.realtimeService.setServer(this.server)
  }

  @SubscribeMessage(REALTIME_SOCKET_EVENTS.join)
  handleJoinRoom(@MessageBody() payload: RealtimeJoinRoomPayload, @ConnectedSocket() client: Socket) {
    if (!payload?.roomId) {
      return { ok: false, error: 'roomId is required' }
    }

    void client.join(payload.roomId)
    return { ok: true }
  }

  @SubscribeMessage(REALTIME_SOCKET_EVENTS.inbound)
  handleInbound(@MessageBody() payload: RealtimeInboundEventPayload) {
    if (!payload?.event) {
      return { ok: false, error: 'event is required' }
    }

    const ok = this.realtimeService.handleInbound(payload.event, payload.payload)
    return { ok }
  }
}
