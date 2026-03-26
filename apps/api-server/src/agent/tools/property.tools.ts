import { tool } from 'ai'
import { z } from 'zod'

import { CREATE_ISSUE_TOOL, QUERY_PROPERTIES_TOOL } from '@repo/shared'
import type { AgentToolsContext } from './types'

export function createQueryPropertiesTool({ propertyService }: AgentToolsContext) {
  return tool({
    description: 'Query all property definitions in the system',
    inputSchema: z.object({}),
    execute: async () => {
      const properties = await propertyService.getPropertyDefinitions()
      return { properties }
    },
  })
}

export function createCreateIssueTool({ issueService, workspaceId, userId }: AgentToolsContext) {
  return tool({
    description: 'Create one or more issues with property values',
    inputSchema: z.object({
      issues: z.array(
        z.object({
          propertyValues: z.array(
            z.object({
              propertyId: z.string(),
              value: z.unknown(),
            }),
          ),
        }),
      ),
    }),
    execute: async ({ issues }) => {
      const results = await issueService.batchCreateIssues(workspaceId, userId, issues)
      return {
        results: results.map(result => ({
          issueId: result.issueId,
          success: result.success,
          errors: result.errors,
        })),
      }
    },
  })
}

export const propertyTools = {
  [QUERY_PROPERTIES_TOOL]: createQueryPropertiesTool,
  [CREATE_ISSUE_TOOL]: createCreateIssueTool,
}
