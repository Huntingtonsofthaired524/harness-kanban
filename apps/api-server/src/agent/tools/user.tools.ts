import { tool } from 'ai'
import { z } from 'zod'

import { GET_AVAILABLE_USERS_TOOL, GET_CURRENT_USER_TOOL } from '@repo/shared'
import type { AgentToolsContext } from './types'

export function createGetAvailableUsersTool({ userService, workspaceId }: AgentToolsContext) {
  return tool({
    description: 'Get all available users in the workspace',
    inputSchema: z.object({}),
    execute: async () => {
      const users = await userService.getAvailableUsers(workspaceId)
      return users
    },
  })
}

export function createGetCurrentUserTool({ userId }: AgentToolsContext) {
  return tool({
    description: 'Get current user information',
    inputSchema: z.object({}),
    execute: async () => {
      return {
        id: userId,
      }
    },
  })
}

export const userTools = {
  [GET_AVAILABLE_USERS_TOOL]: createGetAvailableUsersTool,
  [GET_CURRENT_USER_TOOL]: createGetCurrentUserTool,
}
