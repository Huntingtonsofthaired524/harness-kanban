import { DELETE_COMMENT_TOOL, DELETE_ISSUE_TOOL, UPDATE_COMMENT_TOOL, UPDATE_ISSUE_TOOL } from '@repo/shared'
import { commentTools } from './comment.tools'
import { issueTools } from './issue.tools'
import { propertyTools } from './property.tools'
import { subscriptionTools } from './subscription.tools'
import { todoTools } from './todo.tools'
import { userTools } from './user.tools'
import type { AgentApprovalService } from '../agent-approval.service'
import type { SandboxService } from '../sandbox.service'
import type { TodoToolsDependencies } from './todo.tools'
import type { AgentToolsContext } from './types'

export * from './comment.tools'
export * from './issue.tools'
export * from './property.tools'
export * from './subscription.tools'
export * from './todo.tools'
export * from './types'
export * from './user.tools'

export interface CreateAgentToolsOptions {
  context: AgentToolsContext
  sandboxService: SandboxService
  approvalService: AgentApprovalService
}

type Tool = any

const APPROVAL_REQUIRED_TOOLS = new Set<string>([
  UPDATE_ISSUE_TOOL,
  DELETE_ISSUE_TOOL,
  UPDATE_COMMENT_TOOL,
  DELETE_COMMENT_TOOL,
])

function wrapToolWithApproval(
  toolName: string,
  tool: Tool,
  context: AgentToolsContext,
  approvalService: AgentApprovalService,
): Tool {
  if (!APPROVAL_REQUIRED_TOOLS.has(toolName) || typeof tool?.execute !== 'function') {
    return tool
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalExecute = tool.execute

  return {
    ...tool,
    execute: async (
      args: unknown,
      executeOptions?: {
        toolCallId?: string
      },
    ) => {
      const toolCallId = executeOptions?.toolCallId
      if (toolCallId) {
        await approvalService.waitForApproval({
          chatId: context.chatId,
          toolCallId,
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return originalExecute(args, executeOptions)
    },
  }
}

/**
 * Create all agent tools with the given context
 */
export function createAgentTools(options: CreateAgentToolsOptions): Record<string, Tool> {
  const { context, sandboxService, approvalService } = options
  const { agentService, chatId } = context

  // Helper function to get current chat state
  const getChatState = async () => {
    const metadata = await agentService.getChatMetadata(chatId)
    return metadata?.state ?? {}
  }

  // Helper function to update chat state
  const updateChatState = async (state: Parameters<TodoToolsDependencies['updateChatState']>[0]) => {
    await agentService.updateChatMetadata(chatId, { state })
  }

  const todoDeps: TodoToolsDependencies = {
    getChatState,
    updateChatState,
  }

  // Get sandbox tools (lazy initialization - sandbox created on first tool call)
  const bashTools = sandboxService.getSandboxTools(chatId)

  const allTools = {
    ...Object.fromEntries(Object.entries(propertyTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(issueTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(commentTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(subscriptionTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(userTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(todoTools).map(([name, createTool]) => [name, createTool(todoDeps)])),
    ...bashTools,
  }

  return Object.fromEntries(
    Object.entries(allTools).map(([toolName, tool]) => [
      toolName,
      wrapToolWithApproval(toolName, tool, context, approvalService),
    ]),
  )
}
