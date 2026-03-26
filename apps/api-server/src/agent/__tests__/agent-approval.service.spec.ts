import { RealtimeService } from '@/realtime/realtime.service'
import { AgentApprovalService } from '../agent-approval.service'

describe('AgentApprovalService', () => {
  const baseRequest = {
    chatId: 'chat-1',
    toolCallId: 'call-1',
  }

  let realtimeService: jest.Mocked<RealtimeService>
  let service: AgentApprovalService

  beforeEach(() => {
    realtimeService = {
      emitToRoom: jest.fn(),
      registerInboundHandler: jest.fn(),
      removeInboundHandler: jest.fn(),
      handleInbound: jest.fn(),
      setServer: jest.fn(),
    } as unknown as jest.Mocked<RealtimeService>

    service = new AgentApprovalService(realtimeService)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should resolve when user approves', async () => {
    const waitPromise = service.waitForApproval(baseRequest)

    const resolved = service.resolveApproval({
      chatId: baseRequest.chatId,
      toolCallId: baseRequest.toolCallId,
      approved: true,
    })

    expect(resolved).toBe(true)
    await expect(waitPromise).resolves.toBeUndefined()
    const emitToRoomMock = realtimeService.emitToRoom
    expect(emitToRoomMock).toHaveBeenCalledTimes(1)
  })

  it('should throw rejected error and include optional reason', async () => {
    const waitPromise = service.waitForApproval(baseRequest)

    const resolved = service.resolveApproval({
      chatId: baseRequest.chatId,
      toolCallId: baseRequest.toolCallId,
      approved: false,
      reason: 'command is risky',
    })

    expect(resolved).toBe(true)
    await expect(waitPromise).rejects.toThrow('The user did not approve this operation')
    await expect(waitPromise).rejects.toThrow('Rejection reason: command is risky')
  })

  it('should throw timeout error when no response is received before timeout', async () => {
    jest.useFakeTimers()

    const waitPromise = service.waitForApproval(baseRequest)

    jest.advanceTimersByTime(5 * 60 * 1000)
    await Promise.resolve()

    await expect(waitPromise).rejects.toThrow('requires user approval')
  })

  it('should register inbound response handler on module init', () => {
    service.onModuleInit()

    const registerInboundHandlerMock = realtimeService.registerInboundHandler
    expect(registerInboundHandlerMock).toHaveBeenCalledTimes(1)
  })
})
