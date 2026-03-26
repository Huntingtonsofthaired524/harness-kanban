import { generateText, LanguageModel, ModelMessage, Output, UIMessage } from 'ai'
import { z } from 'zod'

import { PrismaService } from '@/database/prisma.service'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Chat, Message, Part } from '@repo/database'
import { AIProviderFactory } from './ai-provider/ai-provider.factory'
import { convertModelContentToParts, mapUIMessagePartsToDBParts } from './message-mapping'
import { ChatMetadata } from './types/chat-state.types'

/**
 * Schema for chat title generation using structured output
 */
export const chatTitleSchema = z.object({
  title: z.string().max(50).describe('A concise, descriptive title for the chat based on the user message content'),
})

export type ChatTitleSchema = z.infer<typeof chatTitleSchema>

export interface ChatWithMessages extends Chat {
  messages: (Message & { parts: Part[] })[]
}

@Injectable()
export class AgentService {
  private readonly aiProviderFactory: AIProviderFactory

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiProviderFactory = new AIProviderFactory(configService)
  }

  /**
   * Get the AI language model based on environment configuration
   */
  async getModel(): Promise<LanguageModel> {
    return this.aiProviderFactory.createModel()
  }

  /**
   * List all chats for a user, ordered by most recent first
   */
  async listChats(userId: string): Promise<Chat[]> {
    const chats = await this.prisma.client.chat.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return chats
  }

  /**
   * Get chat history with all messages and parts
   */
  async getChatHistory(chatId: string, userId: string): Promise<ChatWithMessages> {
    const chat = await this.prisma.client.chat.findFirst({
      where: {
        id: chatId,
        userId,
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

    if (!chat) {
      throw new NotFoundException('Chat not found')
    }

    return chat
  }

  /**
   * Check if a chat exists and belongs to the user
   */
  async validateChatOwnership(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.prisma.client.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    })

    return chat !== null
  }

  /**
   * Get existing chat or create a new one if it doesn't exist.
   * Throws ForbiddenException if chat exists but belongs to another user.
   */
  async getOrCreateChat(chatId: string, userId: string): Promise<ChatWithMessages> {
    // First check if chat exists with this id (regardless of owner)
    const chatWithId = await this.prisma.client.chat.findUnique({
      where: {
        id: chatId,
      },
    })

    if (chatWithId) {
      // Chat exists - check if it belongs to current user
      if (chatWithId.userId !== userId) {
        throw new ForbiddenException('Chat does not belong to current user')
      }

      // Chat exists and belongs to current user - return with messages
      const chatWithMessages = await this.prisma.client.chat.findFirst({
        where: {
          id: chatId,
          userId,
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

      return chatWithMessages!
    }

    // Chat doesn't exist - create new one
    try {
      const newChat = await this.prisma.client.chat.create({
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

      return newChat
    } catch (error) {
      // Handle race condition: another request created the same chatId concurrently.
      if ((error as { code?: string })?.code === 'P2002') {
        const existingChat = await this.prisma.client.chat.findUnique({
          where: { id: chatId },
        })

        if (!existingChat) {
          throw error
        }
        if (existingChat.userId !== userId) {
          throw new ForbiddenException('Chat does not belong to current user')
        }

        const chatWithMessages = await this.prisma.client.chat.findFirst({
          where: {
            id: chatId,
            userId,
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

        if (!chatWithMessages) {
          throw error
        }

        return chatWithMessages
      }

      throw error
    }
  }

  /**
   * Save user message from UIMessage format
   */
  async saveUserMessage(chatId: string, message: UIMessage): Promise<void> {
    if (message.parts.length === 0) return

    const dbParts = mapUIMessagePartsToDBParts(message.parts, '')

    await this.prisma.client.message.create({
      data: {
        chatId,
        role: message.role,
        parts: {
          create: dbParts.map(part => ({
            type: part.type,
            order: part.order,
            textContent: part.textContent,
            textState: part.textState,
            reasoningContent: part.reasoningContent,
            reasoningState: part.reasoningState,
            fileMediaType: part.fileMediaType,
            fileUrl: part.fileUrl,
            fileFilename: part.fileFilename,
            sourceUrlSourceId: part.sourceUrlSourceId,
            sourceUrlUrl: part.sourceUrlUrl,
            sourceUrlTitle: part.sourceUrlTitle,
            sourceDocumentSourceId: part.sourceDocumentSourceId,
            sourceDocumentMediaType: part.sourceDocumentMediaType,
            sourceDocumentTitle: part.sourceDocumentTitle,
            sourceDocumentFilename: part.sourceDocumentFilename,
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            toolState: part.toolState,
            toolInput: part.toolInput ?? undefined,
            toolOutput: part.toolOutput ?? undefined,
            toolErrorText: part.toolErrorText,
            toolProviderExecuted: part.toolProviderExecuted,
            dataType: part.dataType,
            dataId: part.dataId,
            dataPayload: part.dataPayload ?? undefined,
            providerMetadata: part.providerMetadata ?? undefined,
          })),
        },
      },
    })
  }

  /**
   * Save assistant message from UIMessage format
   * This is the preferred method when you have a complete UIMessage
   */
  async saveAssistantUIMessage(chatId: string, message: UIMessage): Promise<string> {
    if (message.parts.length === 0) return ''

    const dbParts = mapUIMessagePartsToDBParts(message.parts, '')

    const createdMessage = await this.prisma.client.message.create({
      data: {
        chatId,
        role: 'assistant',
        parts: {
          create: dbParts.map(part => ({
            type: part.type,
            order: part.order,
            textContent: part.textContent,
            textState: part.textState,
            reasoningContent: part.reasoningContent,
            reasoningState: part.reasoningState,
            fileMediaType: part.fileMediaType,
            fileUrl: part.fileUrl,
            fileFilename: part.fileFilename,
            sourceUrlSourceId: part.sourceUrlSourceId,
            sourceUrlUrl: part.sourceUrlUrl,
            sourceUrlTitle: part.sourceUrlTitle,
            sourceDocumentSourceId: part.sourceDocumentSourceId,
            sourceDocumentMediaType: part.sourceDocumentMediaType,
            sourceDocumentTitle: part.sourceDocumentTitle,
            sourceDocumentFilename: part.sourceDocumentFilename,
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            toolState: part.toolState,
            toolInput: part.toolInput ?? undefined,
            toolOutput: part.toolOutput ?? undefined,
            toolErrorText: part.toolErrorText,
            toolProviderExecuted: part.toolProviderExecuted,
            dataType: part.dataType,
            dataId: part.dataId,
            dataPayload: part.dataPayload ?? undefined,
            providerMetadata: part.providerMetadata ?? undefined,
          })),
        },
      },
    })

    return createdMessage.id
  }

  /**
   * Append parts to an existing assistant message
   * Used when accumulating step results into a single message
   */
  async appendPartsToAssistantMessage(messageId: string, parts: UIMessage['parts']): Promise<void> {
    if (parts.length === 0) return

    const dbParts = mapUIMessagePartsToDBParts(parts, '')

    // Get current max order to append new parts at the end
    const lastPart = await this.prisma.client.part.findFirst({
      where: { messageId },
      orderBy: { order: 'desc' },
    })
    const startOrder = (lastPart?.order ?? -1) + 1

    await this.prisma.client.part.createMany({
      data: dbParts.map((part, index) => ({
        messageId,
        type: part.type,
        order: startOrder + index,
        textContent: part.textContent,
        textState: part.textState,
        reasoningContent: part.reasoningContent,
        reasoningState: part.reasoningState,
        fileMediaType: part.fileMediaType,
        fileUrl: part.fileUrl,
        fileFilename: part.fileFilename,
        sourceUrlSourceId: part.sourceUrlSourceId,
        sourceUrlUrl: part.sourceUrlUrl,
        sourceUrlTitle: part.sourceUrlTitle,
        sourceDocumentSourceId: part.sourceDocumentSourceId,
        sourceDocumentMediaType: part.sourceDocumentMediaType,
        sourceDocumentTitle: part.sourceDocumentTitle,
        sourceDocumentFilename: part.sourceDocumentFilename,
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        toolState: part.toolState,
        toolInput: part.toolInput ?? undefined,
        toolOutput: part.toolOutput ?? undefined,
        toolErrorText: part.toolErrorText,
        toolProviderExecuted: part.toolProviderExecuted,
        dataType: part.dataType,
        dataId: part.dataId,
        dataPayload: part.dataPayload ?? undefined,
        providerMetadata: part.providerMetadata ?? undefined,
      })),
    })
  }

  /**
   * Save assistant message from ModelMessage format
   * This method converts ModelMessage content to UIMessage parts before saving
   * Use this when working with AI SDK's ModelMessage responses
   */
  async saveAssistantModelMessage(chatId: string, message: ModelMessage): Promise<void> {
    if (message.role !== 'assistant') return

    // Convert ModelMessage content to UIMessage parts
    const parts = convertModelContentToParts(message.content)

    if (parts.length === 0) return

    const uiMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      parts,
    }

    await this.saveAssistantUIMessage(chatId, uiMessage)
  }

  /**
   * Save all messages for a chat, replacing existing messages
   * This is used when frontend wants to sync its state to the database
   */
  async saveMessages(chatId: string, userId: string, messages: UIMessage[]): Promise<void> {
    await this.prisma.client.$transaction(async tx => {
      // Verify chat exists and belongs to user
      const chat = await tx.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
      })

      if (!chat) {
        throw new NotFoundException('Chat not found')
      }

      // Delete all existing messages for this chat
      await tx.message.deleteMany({
        where: {
          chatId,
        },
      })

      // Create new messages with their parts
      for (const message of messages) {
        if (message.parts.length === 0) continue

        const dbParts = mapUIMessagePartsToDBParts(message.parts, '')

        await tx.message.create({
          data: {
            chatId,
            role: message.role,
            parts: {
              create: dbParts.map(part => ({
                type: part.type,
                order: part.order,
                textContent: part.textContent,
                textState: part.textState,
                reasoningContent: part.reasoningContent,
                reasoningState: part.reasoningState,
                fileMediaType: part.fileMediaType,
                fileUrl: part.fileUrl,
                fileFilename: part.fileFilename,
                sourceUrlSourceId: part.sourceUrlSourceId,
                sourceUrlUrl: part.sourceUrlUrl,
                sourceUrlTitle: part.sourceUrlTitle,
                sourceDocumentSourceId: part.sourceDocumentSourceId,
                sourceDocumentMediaType: part.sourceDocumentMediaType,
                sourceDocumentTitle: part.sourceDocumentTitle,
                sourceDocumentFilename: part.sourceDocumentFilename,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                toolState: part.toolState,
                toolInput: part.toolInput ?? undefined,
                toolOutput: part.toolOutput ?? undefined,
                toolErrorText: part.toolErrorText,
                toolProviderExecuted: part.toolProviderExecuted,
                dataType: part.dataType,
                dataId: part.dataId,
                dataPayload: part.dataPayload ?? undefined,
                providerMetadata: part.providerMetadata ?? undefined,
              })),
            },
          },
        })
      }
    })
  }

  /**
   * Get chat metadata
   */
  async getChatMetadata(chatId: string): Promise<ChatMetadata | null> {
    const chat = await this.prisma.client.chat.findUnique({
      where: { id: chatId },
      select: { metadata: true },
    })

    return (chat?.metadata as ChatMetadata) ?? null
  }

  /**
   * Update chat metadata with partial data
   * This merges the new metadata with existing metadata
   */
  async updateChatMetadata(chatId: string, metadata: Partial<ChatMetadata>): Promise<void> {
    const existingChat = await this.prisma.client.chat.findUnique({
      where: { id: chatId },
      select: { metadata: true },
    })

    const existingMetadata = (existingChat?.metadata as ChatMetadata) ?? {}

    const updatedMetadata: any = {
      ...existingMetadata,
      ...metadata,
      // Deep merge state if it exists in both
      state: {
        ...existingMetadata.state,
        ...metadata.state,
      },
    }

    await this.prisma.client.chat.update({
      where: { id: chatId },
      data: {
        metadata: updatedMetadata,
      },
    })
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    await this.prisma.client.chat.update({
      where: { id: chatId },
      data: { title },
    })
  }

  /**
   * Generate a chat title based on the user message content using structured output
   * This should be called asynchronously and not block the main chat flow
   */
  async generateChatTitle(userMessage: string): Promise<string> {
    try {
      const model = await this.getModel()

      const { output } = await generateText({
        model,
        output: Output.object({
          schema: chatTitleSchema,
        }),
        prompt: `Generate a concise, descriptive title (max 50 characters) for a chat that starts with this user message: "${userMessage}"

The title should:
- Be brief and clear (3-6 words ideally)
- Capture the main topic or intent
- Be suitable as a chat header
- Not include quotes or special formatting

Examples:
- User: "I need to create a new issue about server downtime" -> Title: Server Downtime Issue
- User: "What are all the properties available?" -> Title: Available Properties Query
- User: "Help me understand the system" -> Title: System Overview Help`,
      })

      return output.title
    } catch (error) {
      // Fallback to a default title if generation fails
      console.error('Failed to generate chat title:', error)
      return 'New Chat'
    }
  }

  /**
   * Generate and update chat title asynchronously
   * This method is designed to be called without awaiting - fire and forget
   */
  generateAndUpdateChatTitle(
    chatId: string,
    message: UIMessage,
    messageCount: number,
    currentTitle: string | null,
  ): void {
    // Only generate title if it's still the default "New Chat" or null
    if (currentTitle && currentTitle !== 'New Chat') {
      return
    }

    // Only generate title for the first user message in a new chat
    if (messageCount > 1) {
      return
    }

    // Extract text content from user message
    const userMessageText = message.parts
      .filter(part => part.type === 'text')
      .map(part => ('text' in part ? part.text : ''))
      .join(' ')

    // Skip if no text content
    if (!userMessageText) {
      return
    }

    // Fire and forget - don't await this promise
    this.generateChatTitle(userMessageText)
      .then(title => {
        return this.updateChatTitle(chatId, title)
      })
      .catch(error => {
        console.error('Failed to update chat title:', error)
      })
  }
}
