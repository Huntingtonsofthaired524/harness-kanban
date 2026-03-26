export interface RealtimeJoinRoomPayload {
  roomId: string
}

export interface RealtimeInboundEventPayload {
  event: string
  payload: unknown
}

export interface AgentApprovalRequestEvent {
  chatId: string
  toolCallId: string
}

export interface AgentApprovalResponseEvent {
  chatId: string
  toolCallId: string
  approved: boolean
  reason?: string
}
