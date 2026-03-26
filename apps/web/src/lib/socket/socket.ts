'use client'

import { io } from 'socket.io-client'

import { AGENT_APPROVAL_SOCKET_EVENTS, REALTIME_SOCKET_EVENTS, REALTIME_SOCKET_NAMESPACE } from '@repo/shared'
import type { Socket } from 'socket.io-client'

export const AGENT_APPROVAL_SOCKET_NAMESPACE = REALTIME_SOCKET_NAMESPACE
export const AGENT_APPROVAL_REQUEST_EVENT = AGENT_APPROVAL_SOCKET_EVENTS.request

export function createSocket(namespace: string, socketServerUrl: string): Socket {
  return io(`${socketServerUrl}${namespace}`, {
    transports: ['websocket'],
    withCredentials: true,
  })
}

export function joinRealtimeRoom(socket: Socket, roomId: string, ack?: () => void): void {
  socket.emit(REALTIME_SOCKET_EVENTS.join, { roomId }, ack)
}
