/**
 * Tool to QueryKey mapping for cache invalidation
 *
 * This module defines which queries should be invalidated when specific tools
 * modify data. Only data-modifying tools need to be mapped here.
 */

import type { QueryKey } from '@tanstack/react-query'

/**
 * Tool names that modify data and may need cache invalidation
 */
export const DATA_MODIFYING_TOOLS = [
  'createIssue',
  'updateIssue',
  'deleteIssue',
  'createComment',
  'updateComment',
  'deleteComment',
  'addSubscriber',
  'removeSubscriber',
  'addTodo',
  'toggleTodo',
  'deleteTodo',
] as const

export type DataModifyingTool = (typeof DATA_MODIFYING_TOOLS)[number]

/**
 * Check if a tool name is a data-modifying tool
 */
export function isDataModifyingTool(toolName: string): toolName is DataModifyingTool {
  return DATA_MODIFYING_TOOLS.includes(toolName as DataModifyingTool)
}

/**
 * Extract issue ID from tool input/output if available
 */
function extractIssueId(toolName: DataModifyingTool, input: Record<string, unknown>): number | null {
  switch (toolName) {
    case 'createIssue':
      // createIssue doesn't have issueId in input, output has it but we don't have output here
      return null
    case 'updateIssue':
    case 'deleteIssue':
      return typeof input.issueId === 'number' ? input.issueId : null
    case 'createComment':
    case 'updateComment':
    case 'deleteComment':
      return typeof input.issueId === 'number' ? input.issueId : null
    case 'addSubscriber':
    case 'removeSubscriber':
      return typeof input.issueId === 'number' ? input.issueId : null
    default:
      return null
  }
}

/**
 * Build query keys to invalidate based on tool name and input
 *
 * @param toolName - The name of the tool that was executed
 * @param input - The tool input parameters
 * @param orgId - The organization/workspace ID
 * @returns Array of query keys to invalidate
 */
export function buildQueryKeysToInvalidate(
  toolName: DataModifyingTool,
  input: Record<string, unknown>,
  orgId: string,
): QueryKey[] {
  const issueId = extractIssueId(toolName, input)
  const queryKeys: QueryKey[] = []

  switch (toolName) {
    // Issue mutations
    case 'createIssue':
      // Creating an issue affects the issue lists
      queryKeys.push(['api-server', 'issues', orgId])
      queryKeys.push(['api-server', 'issues-infinite', orgId])
      break

    case 'updateIssue':
      // Updating an issue affects the specific issue and lists
      if (issueId) {
        queryKeys.push(['api-server', 'issue', issueId])
        queryKeys.push(['api-server', 'issueActivities', issueId])
        queryKeys.push(['api-server', 'issueComments', issueId])
      }
      queryKeys.push(['api-server', 'issues', orgId])
      queryKeys.push(['api-server', 'issues-infinite', orgId])
      break

    case 'deleteIssue':
      // Deleting an issue affects the specific issue and lists
      if (issueId) {
        queryKeys.push(['api-server', 'issue', issueId])
        queryKeys.push(['api-server', 'issueActivities', issueId])
        queryKeys.push(['api-server', 'issueComments', issueId])
      }
      queryKeys.push(['api-server', 'issues', orgId])
      queryKeys.push(['api-server', 'issues-infinite', orgId])
      break

    // Comment mutations
    case 'createComment':
    case 'updateComment':
    case 'deleteComment':
      if (issueId) {
        queryKeys.push(['api-server', 'issueComments', issueId])
        queryKeys.push(['api-server', 'issueActivities', issueId])
      }
      break

    // Subscription mutations
    case 'addSubscriber':
    case 'removeSubscriber':
      if (issueId) {
        queryKeys.push(['api-server', 'issueActivities', issueId])
      }
      break

    // Todo mutations - todos are stored in chat state, no need to invalidate
    case 'addTodo':
    case 'toggleTodo':
    case 'deleteTodo':
      // Todos are chat-specific and stored in chat metadata
      // No global query keys to invalidate
      break

    default:
      // No invalidation needed for unknown tools
      break
  }

  console.log(`Tool "${toolName}" executed. Invalidating queries:`, queryKeys)
  return queryKeys
}
