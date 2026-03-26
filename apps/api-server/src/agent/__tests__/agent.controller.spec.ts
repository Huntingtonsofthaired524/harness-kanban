import { ActivityService } from '@/issue/activity.service'
import { CommentService } from '@/issue/comment.service'
import { IssueService } from '@/issue/issue.service'
import { PropertyService } from '@/property/property.service'
import { UserService } from '@/user/user.service'
import { NotFoundException } from '@nestjs/common'
import { AgentApprovalService } from '../agent-approval.service'
import { AgentController } from '../agent.controller'
import { AgentService } from '../agent.service'
import { SandboxService } from '../sandbox.service'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => undefined,
  AuthWorkspaceId: () => () => undefined,
}))

describe('AgentController', () => {
  let controller: AgentController
  let agentService: jest.Mocked<AgentService>
  let propertyService: jest.Mocked<PropertyService>
  let issueService: jest.Mocked<IssueService>
  let userService: jest.Mocked<UserService>
  let commentService: jest.Mocked<CommentService>
  let activityService: jest.Mocked<ActivityService>
  let sandboxService: jest.Mocked<SandboxService>
  let approvalService: jest.Mocked<AgentApprovalService>

  beforeEach(() => {
    agentService = {
      listChats: jest.fn(),
      getChatHistory: jest.fn(),
      getOrCreateChat: jest.fn(),
      saveUserMessage: jest.fn(),
      generateAndUpdateChatTitle: jest.fn(),
      saveMessages: jest.fn(),
      saveAssistantUIMessage: jest.fn(),
      appendPartsToAssistantMessage: jest.fn(),
      getModel: jest.fn(),
    } as unknown as jest.Mocked<AgentService>

    propertyService = {} as unknown as jest.Mocked<PropertyService>
    issueService = {} as unknown as jest.Mocked<IssueService>
    userService = {} as unknown as jest.Mocked<UserService>
    commentService = {} as unknown as jest.Mocked<CommentService>
    activityService = {} as unknown as jest.Mocked<ActivityService>
    sandboxService = {} as unknown as jest.Mocked<SandboxService>
    approvalService = {} as unknown as jest.Mocked<AgentApprovalService>

    controller = new AgentController(
      agentService,
      propertyService,
      issueService,
      userService,
      commentService,
      activityService,
      sandboxService,
      approvalService,
    )
  })

  describe('listChats', () => {
    it('should return list of chats for current user', async () => {
      const mockChats = [
        { id: 'chat-1', title: 'Chat 1', updatedAt: new Date('2024-01-01') },
        { id: 'chat-2', title: 'Chat 2', updatedAt: new Date('2024-01-02') },
      ]
      agentService.listChats.mockResolvedValue(mockChats as any)

      const session = { user: { id: 'user-1' } } as any
      const result = await controller.listChats(session)

      expect(agentService.listChats).toHaveBeenCalledWith('user-1')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data![0]).toEqual({
        id: 'chat-1',
        title: 'Chat 1',
        updatedAt: mockChats[0].updatedAt,
      })
    })

    it('should handle empty chat list', async () => {
      agentService.listChats.mockResolvedValue([])

      const session = { user: { id: 'user-1' } } as any
      const result = await controller.listChats(session)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle chats without titles', async () => {
      const mockChats = [{ id: 'chat-1', title: null, updatedAt: new Date() }]
      agentService.listChats.mockResolvedValue(mockChats as any)

      const session = { user: { id: 'user-1' } } as any
      const result = await controller.listChats(session)

      expect(result.data![0].title).toBeNull()
    })
  })

  describe('getHistory', () => {
    it('should return chat history with messages', async () => {
      const mockChat = {
        id: 'chat-1',
        title: 'Test Chat',
        createdAt: new Date('2024-01-01'),
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', textContent: 'Hello', order: 0 }],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            parts: [{ type: 'text', textContent: 'Hi there', order: 0 }],
          },
        ],
      }
      agentService.getChatHistory.mockResolvedValue(mockChat as any)

      const session = { user: { id: 'user-1' } } as any
      const result = await controller.getHistory('chat-1', session)

      expect(agentService.getChatHistory).toHaveBeenCalledWith('chat-1', 'user-1')
      expect(result.success).toBe(true)
      expect(result.data!.id).toBe('chat-1')
      expect(result.data!.messages).toHaveLength(2)
    })

    it('should handle chat with no messages', async () => {
      const mockChat = {
        id: 'chat-1',
        title: 'Empty Chat',
        createdAt: new Date(),
        messages: [],
      }
      agentService.getChatHistory.mockResolvedValue(mockChat as any)

      const session = { user: { id: 'user-1' } } as any
      const result = await controller.getHistory('chat-1', session)

      expect(result.data!.messages).toEqual([])
    })
  })

  describe('saveMessages', () => {
    it('should save messages for a chat', async () => {
      agentService.saveMessages.mockResolvedValue(undefined)

      const session = { user: { id: 'user-1' } } as any
      const messages = [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] as any

      const result = await controller.saveMessages('chat-1', { messages }, session)

      expect(agentService.saveMessages).toHaveBeenCalledWith('chat-1', 'user-1', messages)
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ success: true })
    })

    it('should save multiple messages', async () => {
      agentService.saveMessages.mockResolvedValue(undefined)

      const session = { user: { id: 'user-1' } } as any
      const messages = [
        { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi' }] },
        { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: 'How are you?' }] },
      ] as any

      const result = await controller.saveMessages('chat-1', { messages }, session)

      expect(agentService.saveMessages).toHaveBeenCalledWith('chat-1', 'user-1', messages)
      expect(result.success).toBe(true)
    })
  })
})
