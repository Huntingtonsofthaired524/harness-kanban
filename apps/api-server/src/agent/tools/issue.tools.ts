import { tool } from 'ai'
import { z } from 'zod'

import {
  DELETE_ISSUE_TOOL,
  FilterOperator,
  GET_ISSUE_BY_ID_TOOL,
  GET_ISSUES_TOOL,
  UPDATE_ISSUE_TOOL,
} from '@repo/shared'
import type { IssueRagService } from '@/issue/services/issue-rag.service'
import type { FilterCondition, Operation, SortParam } from '@repo/shared'
import type { AgentToolsContext } from './types'

// Extract FilterOperator values for zod enum
const FILTER_OPERATORS = Object.values(FilterOperator) as [string, ...string[]]

const operatorMapping: Record<string, FilterOperator> = {
  equals: FilterOperator.Equals,
  notEquals: FilterOperator.NotEquals,
  set: FilterOperator.Set,
  ['not set']: FilterOperator.NotSet,
  ['has any of']: FilterOperator.HasAnyOf,
  ['has none of']: FilterOperator.HasNoneOf,
  contains: FilterOperator.Contains,
  notContains: FilterOperator.NotContains,
  startsWith: FilterOperator.StartsWith,
  notStartsWith: FilterOperator.NotStartsWith,
  endsWith: FilterOperator.EndsWith,
  notEndsWith: FilterOperator.NotEndsWith,
  gt: FilterOperator.GreaterThan,
  gte: FilterOperator.GreaterThanOrEqual,
  lt: FilterOperator.LessThan,
  lte: FilterOperator.LessThanOrEqual,
}

export function createGetIssuesTool({ issueService, workspaceId }: AgentToolsContext) {
  return tool({
    description:
      'Get a list of issues with optional filtering, sorting, and pagination. Use this to search for issues or list them.',
    inputSchema: z.object({
      filters: z
        .array(
          z.object({
            propertyId: z.string().describe('The property ID to filter on'),
            operator: z.enum(FILTER_OPERATORS),
            operand: z.unknown().optional().describe('The value to compare against'),
            propertyType: z.string().describe('The type of the property'),
          }),
        )
        .optional()
        .describe('Filter conditions'),
      filterRelation: z.enum(['and', 'or']).optional().describe('How to combine filters (default: and)'),
      sort: z
        .array(
          z.object({
            id: z.string().describe('Property ID to sort by'),
            desc: z.boolean().describe('Sort in descending order'),
          }),
        )
        .optional()
        .describe('Sort parameters'),
      page: z.number().optional().describe('Page number for pagination'),
      pageSize: z.number().optional().describe('Number of items per page'),
    }),
    execute: async ({ filters, filterRelation, sort, page, pageSize }) => {
      const mappedFilters: FilterCondition[] | undefined = filters?.map(f => ({
        propertyId: f.propertyId,
        propertyType: f.propertyType,
        operator:
          operatorMapping[f.operator] ??
          (() => {
            throw new Error(`Invalid operator: ${f.operator}`)
          })(),
        operand: f.operand,
      }))
      const mappedSort: SortParam[] = sort?.map(s => ({ id: s.id, desc: s.desc })) ?? []
      const result = await issueService.getIssues(
        mappedFilters,
        mappedSort,
        workspaceId,
        filterRelation ?? 'and',
        page,
        pageSize,
      )
      return {
        issues: result.issues,
        total: result.total,
      }
    },
  })
}

export function createGetIssueByIdTool({ issueService }: AgentToolsContext) {
  return tool({
    description: 'Get detailed information about a specific issue by its ID',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to retrieve'),
    }),
    execute: async ({ issueId }) => {
      const issue = await issueService.getIssueById(issueId)
      return issue
    },
  })
}

type SemanticSearchIssuesToolContext = Pick<AgentToolsContext, 'issueService' | 'workspaceId'> & {
  issueRagService: IssueRagService
}

export function createSemanticSearchIssuesTool({
  issueRagService,
  issueService,
  workspaceId,
}: SemanticSearchIssuesToolContext) {
  return tool({
    description:
      'Use semantic text relevance to find related issues. Build a concise search query based on user intent instead of copying user wording verbatim. For strict field filtering, use getIssues.',
    inputSchema: z.object({
      query: z.string().describe('Natural language query for semantic search'),
      page: z.number().optional().describe('Page number for pagination (default: 1)'),
      pageSize: z.number().optional().describe('Number of items per page (default: 5, max: 50)'),
    }),
    execute: async ({ query, page, pageSize }) => {
      const normalizedQuery = query.trim()
      if (!normalizedQuery) {
        return {
          issues: [],
          total: 0,
        }
      }

      const normalizedPage = page && page > 0 ? Math.floor(page) : 1
      const normalizedPageSize = pageSize && pageSize > 0 ? Math.min(Math.floor(pageSize), 50) : 5
      const offset = (normalizedPage - 1) * normalizedPageSize

      const searchResult = await issueRagService.searchIssueIds(workspaceId, normalizedQuery, {
        limit: normalizedPageSize,
        offset,
      })

      const issues = await issueService.getIssuesByIds(searchResult.ids, workspaceId)

      return {
        issues,
        total: searchResult.total,
      }
    },
  })
}

export function createUpdateIssueTool({ issueService, workspaceId, userId }: AgentToolsContext) {
  return tool({
    description: 'Update an existing issue with new property values',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to update'),
      operations: z.array(
        z.object({
          propertyId: z.string().describe('The property ID to update'),
          operationType: z.enum(['set', 'add', 'remove', 'clear']),
          operationPayload: z.record(z.string(), z.unknown()).describe('The new value or operation data'),
        }),
      ),
    }),
    execute: async ({ issueId, operations }) => {
      const mappedOperations: Operation[] = operations.map(op => ({
        propertyId: op.propertyId,
        operationType: op.operationType,
        operationPayload: op.operationPayload,
      }))
      const result = await issueService.updateIssue({ workspaceId, userId }, { issueId, operations: mappedOperations })
      return result
    },
  })
}

export function createDeleteIssueTool({ issueService, workspaceId, userId }: AgentToolsContext) {
  return tool({
    description: 'Delete an issue by its ID',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to delete'),
    }),
    execute: async ({ issueId }) => {
      await issueService.deleteIssue(workspaceId, userId, issueId)
      return {
        success: true,
        issueId,
      }
    },
  })
}

export const issueTools = {
  [GET_ISSUES_TOOL]: createGetIssuesTool,
  [GET_ISSUE_BY_ID_TOOL]: createGetIssueByIdTool,
  [UPDATE_ISSUE_TOOL]: createUpdateIssueTool,
  [DELETE_ISSUE_TOOL]: createDeleteIssueTool,
}
