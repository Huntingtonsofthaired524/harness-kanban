import { tool } from 'ai'
import { z } from 'zod'

import { ADD_SUBSCRIBER_TOOL, GET_SUBSCRIBERS_TOOL, REMOVE_SUBSCRIBER_TOOL } from '@repo/shared'
import type { AgentToolsContext } from './types'

export function createGetSubscribersTool({ activityService }: AgentToolsContext) {
  return tool({
    description: 'Get all subscribers for a specific issue',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to get subscribers for'),
    }),
    execute: async ({ issueId }) => {
      const result = await activityService.getActivities(issueId, true)
      return {
        subscriberIds: result.subscriberIds,
      }
    },
  })
}

export function createAddSubscriberTool({ activityService }: AgentToolsContext) {
  return tool({
    description: 'Add subscribers to an issue. Subscribers will receive notifications about issue updates.',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to subscribe to'),
      userIds: z.array(z.string()).describe('Array of user IDs to subscribe'),
    }),
    execute: async ({ issueId, userIds }) => {
      await activityService.subscribeToIssue(issueId, userIds)
      return {
        success: true,
      }
    },
  })
}

export function createRemoveSubscriberTool({ activityService }: AgentToolsContext) {
  return tool({
    description: 'Remove subscribers from an issue. Unsubscribed users will no longer receive notifications.',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to unsubscribe from'),
      userIds: z.array(z.string()).describe('Array of user IDs to unsubscribe'),
    }),
    execute: async ({ issueId, userIds }) => {
      await activityService.unsubscribeFromIssue(issueId, userIds)
      return {
        success: true,
      }
    },
  })
}

export const subscriptionTools = {
  [GET_SUBSCRIBERS_TOOL]: createGetSubscribersTool,
  [ADD_SUBSCRIBER_TOOL]: createAddSubscriberTool,
  [REMOVE_SUBSCRIBER_TOOL]: createRemoveSubscriberTool,
}
