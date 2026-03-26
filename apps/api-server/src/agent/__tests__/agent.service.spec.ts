import { generateText, UIMessage } from 'ai'

import { PrismaService } from '@/database/prisma.service'
import { ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AgentService, chatTitleSchema } from '../agent.service'

// Mock the ai module
jest.mock('ai', () => ({
  generateText: jest.fn(),
  Output: {
    object: jest.fn(schema => ({ type: 'object', ...schema })),
  },
}))

describe('AgentService', () => {
  let service: AgentService
  let prismaService: jest.Mocked<PrismaService>
  let configService: jest.Mocked<ConfigService>
  let consoleErrorSpy: jest.SpyInstance

  const mockChat = {
    id: 'chat-123',
    userId: 'user-123',
    title: 'Test Chat',
    createdAt: new Date(),
    updatedAt: new Date(),
    workspaceId: null,
    metadata: null,
    model: null,
    messages: [],
  }

  beforeEach(() => {
    prismaService = {
      client: {
        $transaction: jest.fn(),
        chat: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        message: {
          create: jest.fn(),
          deleteMany: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<PrismaService>

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>

    service = new AgentService(prismaService, configService)

    // Suppress console.error for expected errors in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('getOrCreateChat', () => {
    it('should return existing chat when it belongs to current user', async () => {
      const chatId = 'existing-chat-123'
      const userId = 'user-123'

      // Mock chat exists and belongs to user
      jest.spyOn(prismaService.client.chat, 'findUnique').mockResolvedValue({
        ...mockChat,
        id: chatId,
        userId,
      } as typeof mockChat)

      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue({
        ...mockChat,
        id: chatId,
        userId,
        messages: [],
      } as typeof mockChat & { messages: [] })

      const result = await service.getOrCreateChat(chatId, userId)

      expect(result.id).toBe(chatId)
      expect(result.userId).toBe(userId)
      expect(prismaService.client.chat.findUnique).toHaveBeenCalledWith({
        where: { id: chatId },
      })
      expect(prismaService.client.chat.create).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException when chat exists but belongs to another user', async () => {
      const chatId = 'existing-chat-123'
      const currentUserId = 'user-456'
      const otherUserId = 'user-123'

      // Mock chat exists but belongs to another user
      jest.spyOn(prismaService.client.chat, 'findUnique').mockResolvedValue({
        ...mockChat,
        id: chatId,
        userId: otherUserId,
      } as typeof mockChat)

      await expect(service.getOrCreateChat(chatId, currentUserId)).rejects.toThrow(ForbiddenException)

      expect(prismaService.client.chat.findUnique).toHaveBeenCalledWith({
        where: { id: chatId },
      })
      expect(prismaService.client.chat.create).not.toHaveBeenCalled()
    })

    it('should create new chat when chat does not exist', async () => {
      const chatId = 'new-chat-123'
      const userId = 'user-123'

      // Mock chat does not exist
      jest.spyOn(prismaService.client.chat, 'findUnique').mockResolvedValue(null)

      // Mock create returns new chat
      jest.spyOn(prismaService.client.chat, 'create').mockResolvedValue({
        ...mockChat,
        id: chatId,
        userId,
        messages: [],
      } as typeof mockChat & { messages: [] })

      const result = await service.getOrCreateChat(chatId, userId)

      expect(result.id).toBe(chatId)
      expect(result.userId).toBe(userId)
      expect(prismaService.client.chat.create).toHaveBeenCalledWith({
        data: {
          id: chatId,
          userId,
          title: 'New Chat',
        },
        include: {
          messages: {
            include: {
              parts: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })
    })

    it('should return chat when create hits unique conflict but chat belongs to same user', async () => {
      const chatId = 'racing-chat-123'
      const userId = 'user-123'

      jest
        .spyOn(prismaService.client.chat, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockChat,
          id: chatId,
          userId,
        } as typeof mockChat)

      const uniqueError = new Error('Unique constraint failed') as Error & { code: string }
      uniqueError.code = 'P2002'
      jest.spyOn(prismaService.client.chat, 'create').mockRejectedValue(uniqueError)

      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue({
        ...mockChat,
        id: chatId,
        userId,
        messages: [],
      } as typeof mockChat & { messages: [] })

      const result = await service.getOrCreateChat(chatId, userId)

      expect(result.id).toBe(chatId)
      expect(result.userId).toBe(userId)
      expect(prismaService.client.chat.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: chatId },
      })
    })

    it('should throw ForbiddenException when create hits unique conflict but chat belongs to another user', async () => {
      const chatId = 'racing-chat-123'
      const currentUserId = 'user-456'
      const otherUserId = 'user-123'

      jest
        .spyOn(prismaService.client.chat, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockChat,
          id: chatId,
          userId: otherUserId,
        } as typeof mockChat)

      const uniqueError = new Error('Unique constraint failed') as Error & { code: string }
      uniqueError.code = 'P2002'
      jest.spyOn(prismaService.client.chat, 'create').mockRejectedValue(uniqueError)

      await expect(service.getOrCreateChat(chatId, currentUserId)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('updateChatTitle', () => {
    it('should update chat title', async () => {
      const chatId = 'chat-123'
      const newTitle = 'Updated Title'

      jest.spyOn(prismaService.client.chat, 'update').mockResolvedValue({
        ...mockChat,
        id: chatId,
        title: newTitle,
      } as typeof mockChat)

      await service.updateChatTitle(chatId, newTitle)

      expect(prismaService.client.chat.update).toHaveBeenCalledWith({
        where: { id: chatId },
        data: { title: newTitle },
      })
    })
  })

  describe('generateChatTitle', () => {
    it('should generate a title using structured output', async () => {
      const userMessage = 'I need to create an issue about server downtime'
      const expectedTitle = 'Server Downtime Issue'

      // Mock generateText to return a structured output
      const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>
      mockGenerateText.mockResolvedValue({
        output: { title: expectedTitle },
      } as any)

      const result = await service.generateChatTitle(userMessage)

      expect(result).toBe(expectedTitle)
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          output: expect.objectContaining({
            type: 'object',
            schema: chatTitleSchema,
          }),
          prompt: expect.stringContaining(userMessage),
        }),
      )
    })

    it('should return "New Chat" when generation fails', async () => {
      const userMessage = 'Some message'

      // Mock generateText to throw an error
      const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>
      mockGenerateText.mockRejectedValue(new Error('AI service error'))

      const result = await service.generateChatTitle(userMessage)

      expect(result).toBe('New Chat')
    })

    it('should use the model from getModel for title generation', async () => {
      const userMessage = 'Test message'
      const mockModel = { id: 'mock-model' } as unknown as ReturnType<typeof service.getModel>

      // Mock getModel to return a specific model
      jest.spyOn(service, 'getModel').mockResolvedValue(mockModel)

      const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>
      mockGenerateText.mockResolvedValue({
        output: { title: 'Test Title' },
      } as any)

      await service.generateChatTitle(userMessage)

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: mockModel,
        }),
      )
    })
  })

  describe('generateAndUpdateChatTitle', () => {
    const createMockMessage = (text: string): UIMessage => ({
      id: 'msg-1',
      role: 'user',
      parts: [{ type: 'text', text }],
    })

    it('should generate and update title when current title is "New Chat"', async () => {
      const chatId = 'chat-123'
      const userMessage = 'Create an issue for server outage'
      const generatedTitle = 'Server Outage Issue'
      const message = createMockMessage(userMessage)

      jest.spyOn(service, 'generateChatTitle').mockResolvedValue(generatedTitle)
      jest.spyOn(service, 'updateChatTitle').mockResolvedValue(undefined)

      service.generateAndUpdateChatTitle(chatId, message, 1, 'New Chat')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(service.generateChatTitle).toHaveBeenCalledWith(userMessage)
      expect(service.updateChatTitle).toHaveBeenCalledWith(chatId, generatedTitle)
    })

    it('should generate and update title when current title is null', async () => {
      const chatId = 'chat-123'
      const userMessage = 'Help with issue management'
      const generatedTitle = 'Issue Management Help'
      const message = createMockMessage(userMessage)

      jest.spyOn(service, 'generateChatTitle').mockResolvedValue(generatedTitle)
      jest.spyOn(service, 'updateChatTitle').mockResolvedValue(undefined)

      service.generateAndUpdateChatTitle(chatId, message, 1, null)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(service.generateChatTitle).toHaveBeenCalledWith(userMessage)
      expect(service.updateChatTitle).toHaveBeenCalledWith(chatId, generatedTitle)
    })

    it('should not generate title when current title is already customized', async () => {
      const chatId = 'chat-123'
      const userMessage = 'Another message'
      const existingTitle = 'Custom Title'
      const message = createMockMessage(userMessage)

      jest.spyOn(service, 'generateChatTitle')
      jest.spyOn(service, 'updateChatTitle')

      service.generateAndUpdateChatTitle(chatId, message, 1, existingTitle)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(service.generateChatTitle).not.toHaveBeenCalled()
      expect(service.updateChatTitle).not.toHaveBeenCalled()
    })

    it('should not generate title when message count is greater than 1', async () => {
      const chatId = 'chat-123'
      const userMessage = 'Second message'
      const message = createMockMessage(userMessage)

      jest.spyOn(service, 'generateChatTitle')
      jest.spyOn(service, 'updateChatTitle')

      service.generateAndUpdateChatTitle(chatId, message, 2, 'New Chat')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(service.generateChatTitle).not.toHaveBeenCalled()
      expect(service.updateChatTitle).not.toHaveBeenCalled()
    })

    it('should not generate title when message has no text content', async () => {
      const chatId = 'chat-123'
      const message: UIMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [],
      }

      jest.spyOn(service, 'generateChatTitle')
      jest.spyOn(service, 'updateChatTitle')

      service.generateAndUpdateChatTitle(chatId, message, 1, 'New Chat')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(service.generateChatTitle).not.toHaveBeenCalled()
      expect(service.updateChatTitle).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully without throwing', async () => {
      const chatId = 'chat-123'
      const userMessage = 'Test message'
      const message = createMockMessage(userMessage)

      jest.spyOn(service, 'generateChatTitle').mockRejectedValue(new Error('Generation failed'))
      jest.spyOn(service, 'updateChatTitle')

      // Should not throw
      expect(() => {
        service.generateAndUpdateChatTitle(chatId, message, 1, 'New Chat')
      }).not.toThrow()

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(service.generateChatTitle).toHaveBeenCalled()
      // updateChatTitle should not be called if generation fails
      expect(service.updateChatTitle).not.toHaveBeenCalled()
    })
  })

  describe('chatTitleSchema', () => {
    it('should validate a valid title', () => {
      const validData = { title: 'Valid Chat Title' }
      const result = chatTitleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject titles longer than 50 characters', () => {
      const invalidData = { title: 'A'.repeat(51) }
      const result = chatTitleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept titles at exactly 50 characters', () => {
      const validData = { title: 'A'.repeat(50) }
      const result = chatTitleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing title', () => {
      const invalidData = {}
      const result = chatTitleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('listChats', () => {
    it('should return list of chats for user', async () => {
      const userId = 'user-123'
      const mockChats = [
        { id: 'chat-1', title: 'Chat 1', userId, createdAt: new Date(), updatedAt: new Date() },
        { id: 'chat-2', title: 'Chat 2', userId, createdAt: new Date(), updatedAt: new Date() },
      ]

      jest.spyOn(prismaService.client.chat, 'findMany').mockResolvedValue(mockChats as any)

      const result = await service.listChats(userId)

      expect(prismaService.client.chat.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('chat-1')
    })

    it('should return empty array when user has no chats', async () => {
      jest.spyOn(prismaService.client.chat, 'findMany').mockResolvedValue([])

      const result = await service.listChats('user-123')

      expect(result).toEqual([])
    })
  })

  describe('getChatHistory', () => {
    it('should return chat with messages', async () => {
      const chatId = 'chat-123'
      const userId = 'user-123'
      const mockChatWithMessages = {
        ...mockChat,
        id: chatId,
        userId,
        messages: [
          { id: 'msg-1', role: 'user', parts: [], createdAt: new Date() },
          { id: 'msg-2', role: 'assistant', parts: [], createdAt: new Date() },
        ],
      }

      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue(mockChatWithMessages as any)

      const result = await service.getChatHistory(chatId, userId)

      expect(prismaService.client.chat.findFirst).toHaveBeenCalledWith({
        where: { id: chatId, userId },
        include: {
          messages: {
            include: { parts: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      expect(result.id).toBe(chatId)
      expect(result.messages).toHaveLength(2)
    })

    it('should throw NotFoundException when chat not found', async () => {
      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue(null)

      await expect(service.getChatHistory('nonexistent', 'user-123')).rejects.toThrow('Chat not found')
    })
  })

  describe('validateChatOwnership', () => {
    it('should return true when chat belongs to user', async () => {
      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue({
        ...mockChat,
        userId: 'user-123',
      } as typeof mockChat)

      const result = await service.validateChatOwnership('chat-123', 'user-123')

      expect(result).toBe(true)
      expect(prismaService.client.chat.findFirst).toHaveBeenCalledWith({
        where: { id: 'chat-123', userId: 'user-123' },
      })
    })

    it('should return false when chat belongs to different user', async () => {
      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue(null)

      const result = await service.validateChatOwnership('chat-123', 'user-123')

      expect(result).toBe(false)
    })

    it('should return false when chat does not exist', async () => {
      jest.spyOn(prismaService.client.chat, 'findFirst').mockResolvedValue(null)

      const result = await service.validateChatOwnership('nonexistent', 'user-123')

      expect(result).toBe(false)
    })
  })

  describe('saveUserMessage', () => {
    it('should save user message with parts', async () => {
      const message: UIMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      }

      jest.spyOn(prismaService.client.message, 'create').mockResolvedValue({ id: 'db-msg-id' } as any)

      await service.saveUserMessage('chat-123', message)

      expect(prismaService.client.message.create).toHaveBeenCalled()
    })

    it('should not save message with no parts', async () => {
      const message: UIMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [],
      }

      await service.saveUserMessage('chat-123', message)

      expect(prismaService.client.message.create).not.toHaveBeenCalled()
    })
  })

  describe('saveAssistantUIMessage', () => {
    it('should save assistant message and return message id', async () => {
      const message: UIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hello' }],
      }

      jest.spyOn(prismaService.client.message, 'create').mockResolvedValue({ id: 'db-msg-id' } as any)

      const result = await service.saveAssistantUIMessage('chat-123', message)

      expect(result).toBe('db-msg-id')
      expect(prismaService.client.message.create).toHaveBeenCalled()
    })

    it('should return empty string for message with no parts', async () => {
      const message: UIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [],
      }

      const result = await service.saveAssistantUIMessage('chat-123', message)

      expect(result).toBe('')
      expect(prismaService.client.message.create).not.toHaveBeenCalled()
    })
  })
})
