import { RealtimeService } from '@/realtime/realtime.service'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AGENT_APPROVAL_SOCKET_EVENTS, AgentApprovalRequestEvent, AgentApprovalResponseEvent } from '@repo/shared'

interface PendingApproval {
  promise: Promise<PendingApprovalResult>
  resolve: (result: PendingApprovalResult) => void
  timeoutHandle: NodeJS.Timeout
}

interface PendingApprovalResult {
  status: 'approved' | 'rejected' | 'timeout'
  reason?: string
}

export class ToolApprovalRejectedError extends Error {
  constructor(reason?: string) {
    const reasonText = reason?.trim()
    const suffix = reasonText ? ` Rejection reason: ${reasonText}` : ''
    super(`Tool execution was rejected by the user. The user did not approve this operation.${suffix}`)
    this.name = 'ToolApprovalRejectedError'
  }
}

export class ToolApprovalTimeoutError extends Error {
  constructor() {
    super('Tool execution requires user approval, but the user has not responded promptly. Pause the workflow for now.')
    this.name = 'ToolApprovalTimeoutError'
  }
}

@Injectable()
export class AgentApprovalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentApprovalService.name)
  private readonly defaultTimeoutMs = 5 * 60 * 1000
  private readonly pendingApprovals = new Map<string, PendingApproval>()

  constructor(private readonly realtimeService: RealtimeService) {}

  onModuleInit(): void {
    this.realtimeService.registerInboundHandler(AGENT_APPROVAL_SOCKET_EVENTS.response, payload => {
      if (!payload || typeof payload !== 'object') {
        return false
      }

      const response = payload as Partial<AgentApprovalResponseEvent>
      if (!response.chatId || !response.toolCallId) {
        return false
      }

      if (typeof response.approved !== 'boolean') {
        return false
      }

      return this.resolveApproval({
        chatId: response.chatId,
        toolCallId: response.toolCallId,
        approved: response.approved,
        reason: response.reason,
      })
    })
  }

  async waitForApproval(request: AgentApprovalRequestEvent): Promise<void> {
    const key = this.getKey(request.chatId, request.toolCallId)

    const pending = this.pendingApprovals.get(key) ?? this.createPendingApproval(key, request)
    const result = await pending.promise

    if (result.status === 'rejected') {
      throw new ToolApprovalRejectedError(result.reason)
    }

    if (result.status === 'timeout') {
      throw new ToolApprovalTimeoutError()
    }
  }

  resolveApproval(response: AgentApprovalResponseEvent): boolean {
    const key = this.getKey(response.chatId, response.toolCallId)
    const pending = this.pendingApprovals.get(key)
    if (!pending) {
      return false
    }

    this.completePendingApproval(key, pending, {
      status: response.approved ? 'approved' : 'rejected',
      reason: response.reason,
    })
    return true
  }

  onModuleDestroy(): void {
    this.realtimeService.removeInboundHandler(AGENT_APPROVAL_SOCKET_EVENTS.response)

    for (const [key, pending] of this.pendingApprovals.entries()) {
      this.completePendingApproval(key, pending, false)
    }
  }

  private createPendingApproval(key: string, request: AgentApprovalRequestEvent): PendingApproval {
    let resolveFn: (result: PendingApprovalResult) => void = () => {}
    const promise = new Promise<PendingApprovalResult>(resolve => {
      resolveFn = resolve
    })

    const timeoutHandle = setTimeout(() => {
      const pending = this.pendingApprovals.get(key)
      if (!pending) return

      this.logger.warn(`Approval timeout in chat "${request.chatId}" (toolCallId: ${request.toolCallId})`)
      this.completePendingApproval(key, pending, {
        status: 'timeout',
      })
    }, this.defaultTimeoutMs)

    const pending: PendingApproval = {
      promise,
      resolve: resolveFn,
      timeoutHandle,
    }

    this.pendingApprovals.set(key, pending)

    this.realtimeService.emitToRoom(request.chatId, AGENT_APPROVAL_SOCKET_EVENTS.request, {
      chatId: request.chatId,
      toolCallId: request.toolCallId,
    })

    return pending
  }

  private completePendingApproval(
    key: string,
    pending: PendingApproval,
    result: PendingApprovalResult | boolean,
  ): void {
    const normalizedResult: PendingApprovalResult =
      typeof result === 'boolean'
        ? { status: result ? 'approved' : 'rejected' }
        : { status: result.status, reason: result.reason?.trim() || undefined }

    clearTimeout(pending.timeoutHandle)
    this.pendingApprovals.delete(key)
    pending.resolve(normalizedResult)
  }

  private getKey(chatId: string, toolCallId: string): string {
    return `${chatId}:${toolCallId}`
  }
}
