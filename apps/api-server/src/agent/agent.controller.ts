import { convertToModelMessages, generateId, ToolLoopAgent, UIMessage } from 'ai'

import { AuthWorkspaceId } from '@/auth/decorators/organization.decorator'
import { ApiResponse as BaseApiResponse, makeSuccessResponse } from '@/common/responses/api-response'
import { ActivityService } from '@/issue/activity.service'
import { CommentService } from '@/issue/comment.service'
import { IssueService } from '@/issue/issue.service'
import { PropertyService } from '@/property/property.service'
import { UserService } from '@/user/user.service'
import { Body, Controller, Get, NotFoundException, Param, Post, Res, Session } from '@nestjs/common'
import { Chat, Message, Part } from '@repo/database'
import { UserSession } from '@thallesp/nestjs-better-auth'
import { AgentApprovalService } from './agent-approval.service'
import { AgentService } from './agent.service'
import { createAgentTools } from './agent.tools'
import { mapDBMessageToUIMessage } from './message-mapping'
import { SandboxService } from './sandbox.service'
import type { Response } from 'express'

/**
 * Chat response format with UIMessages for frontend useChat
 */
interface ChatResponse {
  id: string
  title: string | null
  createdAt: Date
  messages: UIMessage[]
}

/**
 * Chat list item format (without messages)
 */
interface ChatListItem {
  id: string
  title: string | null
  updatedAt: Date
}

@Controller('api/v1/agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly propertyService: PropertyService,
    private readonly issueService: IssueService,
    private readonly userService: UserService,
    private readonly commentService: CommentService,
    private readonly activityService: ActivityService,
    private readonly sandboxService: SandboxService,
    private readonly approvalService: AgentApprovalService,
  ) {}

  /**
   * List all chats for current user
   */
  @Get('/chats')
  async listChats(@Session() session: UserSession): Promise<BaseApiResponse<ChatListItem[]>> {
    const userId = session.user.id
    const chats = await this.agentService.listChats(userId)

    return makeSuccessResponse(
      chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      })),
    )
  }

  /**
   * Get chat history
   */
  @Get('/chat/:chatId/history')
  async getHistory(
    @Param('chatId') chatId: string,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<ChatResponse>> {
    const userId = session.user.id
    const chat = await this.agentService.getChatHistory(chatId, userId)

    return makeSuccessResponse(this.mapChatToResponse(chat))
  }

  /**
   * Chat endpoint with persistence
   */
  @Post('/chat')
  async chat(
    @Body() body: { message: UIMessage; id?: string },
    @Res() response: Response,
    @Session() session: UserSession,
    @AuthWorkspaceId() workspaceId: string,
  ) {
    const userId = session.user.id
    const chatId = body.id
    const { message } = body

    if (!chatId) {
      throw new NotFoundException('Chat ID is required')
    }

    // Get existing chat or create a new one
    const chat = await this.agentService.getOrCreateChat(chatId, userId)

    // Save user message
    await this.agentService.saveUserMessage(chatId, message)

    // Trigger title generation asynchronously (fire and forget)
    this.agentService.generateAndUpdateChatTitle(chatId, message, chat.messages.length, chat.title)

    // Load chat history with all messages (including the one just saved)
    const chatHistory = await this.agentService.getChatHistory(chatId, userId)

    // Map all messages from database to UIMessage format
    const allMessages = chatHistory.messages.map(msg =>
      mapDBMessageToUIMessage({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
      }),
    )

    // Convert UIMessages to AI SDK format
    const modelMessages = await convertToModelMessages(allMessages)

    // Create tools with session context
    const tools = createAgentTools({
      context: {
        propertyService: this.propertyService,
        issueService: this.issueService,
        userService: this.userService,
        commentService: this.commentService,
        activityService: this.activityService,
        agentService: this.agentService,
        workspaceId,
        userId,
        chatId,
      },
      sandboxService: this.sandboxService,
      approvalService: this.approvalService,
    })

    // Get model from AI provider factory based on environment configuration
    const model = await this.agentService.getModel()

    const agent = new ToolLoopAgent({
      model,
      tools,
    })

    // Track the current assistant message ID across steps
    let currentAssistantMessageId: string | null = null

    const result = await agent.stream({
      prompt: modelMessages,
      onStepFinish: async step => {
        // Build parts from content
        // Important: For each toolCallId, we should only save ONE tool part with the FINAL state.
        // If we save both tool-call (input-available) and tool-result (output-available) with the same
        // toolCallId, convertToModelMessages will create duplicate tool_call entries.
        // Solution: First pass - collect tool results by toolCallId, then second pass - build ordered parts.
        const toolResultsMap = new Map<string, UIMessage['parts'][number]>()

        // First pass: collect all tool results and errors (final state)
        for (const part of step.content) {
          if (part.type === 'tool-result') {
            const tr = part as { toolCallId: string; toolName: string; input?: unknown; output?: unknown }
            toolResultsMap.set(tr.toolCallId, {
              type: `tool-${tr.toolName}`,
              toolCallId: tr.toolCallId,
              toolName: tr.toolName,
              state: 'output-available',
              input: (tr.input as Record<string, unknown>) ?? {},
              output: tr.output as Record<string, unknown> | undefined,
            } as UIMessage['parts'][number])
          } else if (part.type === 'tool-error') {
            const te = part as { toolCallId: string; toolName: string; input?: unknown; error?: unknown }
            toolResultsMap.set(te.toolCallId, {
              type: `tool-${te.toolName}`,
              toolCallId: te.toolCallId,
              toolName: te.toolName,
              state: 'output-error',
              input: (te.input as Record<string, unknown>) ?? {},
              errorText: te.error instanceof Error ? te.error.message : String(te.error ?? 'Unknown error'),
            } as UIMessage['parts'][number])
          }
        }

        // Second pass: build ordered parts list
        // Start with a step-start marker to indicate the beginning of a new step
        const assistantParts: UIMessage['parts'] = [{ type: 'step-start' }]
        const processedToolCallIds = new Set<string>()

        for (const part of step.content) {
          if (part.type === 'text') {
            assistantParts.push({
              type: 'text',
              text: part.text,
            })
          } else if (part.type === 'reasoning') {
            const r = part as { text: string }
            assistantParts.push({
              type: 'reasoning',
              text: r.text,
            })
          } else if (part.type === 'source') {
            const s = part as { id: string; url: string; title?: string }
            assistantParts.push({
              type: 'source-url',
              sourceId: s.id,
              url: s.url,
              title: s.title,
            })
          } else if (part.type === 'file') {
            const f = part as { file: { mediaType: string; base64: string } }
            assistantParts.push({
              type: 'file',
              mediaType: f.file.mediaType,
              url: `data:${f.file.mediaType};base64,${f.file.base64}`,
            })
          } else if (part.type === 'tool-call') {
            const tc = part as { toolCallId: string; toolName: string; input?: unknown }
            // Skip if we already processed this toolCallId (shouldn't happen in normal flow)
            if (processedToolCallIds.has(tc.toolCallId)) continue
            processedToolCallIds.add(tc.toolCallId)

            // Use tool-result if available, otherwise use tool-call
            if (toolResultsMap.has(tc.toolCallId)) {
              assistantParts.push(toolResultsMap.get(tc.toolCallId)!)
            } else {
              assistantParts.push({
                type: `tool-${tc.toolName}`,
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                state: 'input-available',
                input: (tc.input as Record<string, unknown>) ?? {},
              } as UIMessage['parts'][number])
            }
          }
          // tool-result and tool-error parts are already handled via toolResultsMap, skip them in second pass
        }

        if (assistantParts.length > 0) {
          if (currentAssistantMessageId) {
            // Append to existing message
            await this.agentService.appendPartsToAssistantMessage(currentAssistantMessageId, assistantParts)
          } else {
            // Create new message on first step
            const message: UIMessage = {
              id: generateId(),
              role: 'assistant',
              parts: assistantParts,
            }
            currentAssistantMessageId = await this.agentService.saveAssistantUIMessage(chatId, message)
          }
        }
      },
    })

    // Ensure stream completes
    result.consumeStream()

    // Pipe stream to HTTP response
    result.pipeUIMessageStreamToResponse(response)
  }

  /**
   * Save all messages for a chat (replaces existing messages)
   */
  @Post('/chat/:chatId/messages')
  async saveMessages(
    @Param('chatId') chatId: string,
    @Body() body: { messages: UIMessage[] },
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<{ success: boolean }>> {
    const userId = session.user.id
    await this.agentService.saveMessages(chatId, userId, body.messages)

    return makeSuccessResponse({ success: true })
  }

  /**
   * Map database chat with messages to UIMessage format for frontend useChat
   * UIMessage format: { id, role, parts }
   * parts: Array<{ type: 'text', text: string }>
   */
  private mapChatToResponse(chat: Chat & { messages?: (Message & { parts?: Part[] })[] }): ChatResponse {
    return {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      messages:
        chat.messages?.map(msg =>
          mapDBMessageToUIMessage({
            id: msg.id,
            role: msg.role,
            parts: msg.parts ?? [],
          }),
        ) ?? [],
    }
  }
}
