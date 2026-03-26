import { Injectable, Logger } from '@nestjs/common'
import type { Server } from 'socket.io'

export type RealtimeInboundHandler = (payload: unknown) => boolean

// TODO: Too many layers of abstraction. Consider exposing the socket server interface directly.

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name)
  private server: Server | null = null
  private readonly inboundHandlers = new Map<string, RealtimeInboundHandler>()

  setServer(server: Server): void {
    this.server = server
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.warn(`Realtime server is not ready. Dropping event "${event}" for room "${room}".`)
      return
    }

    this.server.to(room).emit(event, payload)
  }

  registerInboundHandler(event: string, handler: RealtimeInboundHandler): void {
    this.inboundHandlers.set(event, handler)
  }

  removeInboundHandler(event: string): void {
    this.inboundHandlers.delete(event)
  }

  handleInbound(event: string, payload: unknown): boolean {
    const handler = this.inboundHandlers.get(event)
    if (!handler) {
      return false
    }

    return handler(payload)
  }
}
