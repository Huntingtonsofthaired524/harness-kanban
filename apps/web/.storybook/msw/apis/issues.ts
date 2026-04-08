import { http } from 'msw/core/http'

import { ActivityType } from '@repo/shared/issue/constants'
import { FilterOperator, SystemPropertyId } from '@repo/shared/property/constants'
import { getStatusPropertyConfig, resolveStatusActions } from '@repo/shared/property/status-config'
import { defaultProperties } from './properties'
import type { Activity, Comment } from '@repo/shared/issue/types'
import type { FilterCondition, Issue, Operation } from '@repo/shared/property/types'

export type MockIssue = Issue

type CreateIssuesHandlerOptions = {
  issues?: MockIssue[]
  total?: number
  rejectStatusIds?: string[]
}

type CreateIssueActivitiesHandlerOptions = {
  activities?: Activity[]
  subscriberIds?: string[]
}

export const createMockIssues = (count = 5): MockIssue[] =>
  Array.from({ length: count }, (_, i) => ({
    issueId: i + 1,
    propertyValues: [
      { propertyId: SystemPropertyId.ID, value: i + 1 },
      { propertyId: SystemPropertyId.TITLE, value: `Sample Issue ${i + 1}` },
      { propertyId: SystemPropertyId.STATUS, value: i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'in_progress' : 'in_review' },
      { propertyId: SystemPropertyId.PRIORITY, value: i % 3 === 0 ? 'high' : 'medium' },
      { propertyId: SystemPropertyId.PROJECT, value: i % 2 === 0 ? 'project-1' : 'project-2' },
      { propertyId: SystemPropertyId.ASSIGNEE, value: i % 3 === 0 ? 'user-1' : i % 3 === 1 ? 'user-2' : 'user-3' },
    ],
  }))

const getIssuePropertyValue = (issue: MockIssue, propertyId: string) => {
  return issue.propertyValues.find(propertyValue => propertyValue.propertyId === propertyId)?.value
}

const setIssuePropertyValue = (issue: MockIssue, propertyId: string, value: unknown) => {
  const existingValue = issue.propertyValues.find(propertyValue => propertyValue.propertyId === propertyId)

  if (existingValue) {
    existingValue.value = value
    return
  }

  issue.propertyValues.push({ propertyId, value })
}

const applyFilters = (issues: MockIssue[], filters: FilterCondition[]) => {
  if (filters.length === 0) {
    return issues
  }

  return issues.filter(issue =>
    filters.every(filter => {
      const issueValue = getIssuePropertyValue(issue, filter.propertyId)

      if (filter.operator === FilterOperator.HasAnyOf && Array.isArray(filter.operand)) {
        return filter.operand.includes(issueValue)
      }

      return true
    }),
  )
}

export const createIssuesHandler = ({
  issues = createMockIssues(),
  total,
}: CreateIssuesHandlerOptions = {}): ReturnType<typeof http.get> => {
  return http.get('*/api/v1/issues', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const perPage = parseInt(url.searchParams.get('perPage') || '20', 10)
    const filters = (() => {
      try {
        const rawFilters = url.searchParams.get('filters')
        const parsedFilters = rawFilters ? JSON.parse(rawFilters) : []
        return Array.isArray(parsedFilters) ? (parsedFilters as FilterCondition[]) : []
      } catch {
        return []
      }
    })()
    const filteredIssues = applyFilters(issues, filters)
    const resolvedTotal = total ?? filteredIssues.length
    const startIndex = Math.max(0, (page - 1) * perPage)
    const endIndex = startIndex + perPage
    const paginatedIssues = filteredIssues.slice(startIndex, endIndex)

    return Response.json({
      success: true,
      data: {
        issues: paginatedIssues,
        pagination: {
          total: resolvedTotal,
          page,
          perPage,
          totalPages: resolvedTotal > 0 ? Math.ceil(resolvedTotal / perPage) : 0,
        },
      },
      error: null,
    })
  })
}

export const createIssueHandler = (issues: MockIssue[] = createMockIssues()): ReturnType<typeof http.get> => {
  return http.get('*/api/v1/issues/:issueId', ({ params }) => {
    const issueId = Number(params.issueId)
    const issue = issues.find(candidate => candidate.issueId === issueId)

    if (!issue) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: 'ISSUE_NOT_FOUND',
            message: 'Issue not found',
          },
        },
        { status: 404 },
      )
    }

    return Response.json({
      success: true,
      data: { issue },
      error: null,
    })
  })
}

export const createUpdateIssueHandler = ({
  issues = createMockIssues(),
  rejectStatusIds = [],
}: CreateIssuesHandlerOptions = {}): ReturnType<typeof http.put> => {
  return http.put('*/api/v1/issues/:issueId', async ({ params, request }) => {
    const issueId = Number(params.issueId)
    const issue = issues.find(candidate => candidate.issueId === issueId)

    if (!issue) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: 'ISSUE_NOT_FOUND',
            message: 'Issue not found',
          },
        },
        { status: 404 },
      )
    }

    const body = (await request.json()) as { operations?: Operation[] }
    const operations = Array.isArray(body.operations) ? body.operations : []
    const statusSetOperation = operations.find(
      operation => operation.propertyId === SystemPropertyId.STATUS && operation.operationType === 'set',
    )

    const nextStatusId =
      typeof statusSetOperation?.operationPayload?.value === 'string' ? statusSetOperation.operationPayload.value : null

    if (nextStatusId && rejectStatusIds.includes(nextStatusId)) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot move issue to ${nextStatusId}.`,
          },
        },
        { status: 403 },
      )
    }

    for (const operation of operations) {
      if (operation.operationType === 'set') {
        setIssuePropertyValue(issue, operation.propertyId, operation.operationPayload.value)
      }
    }

    return Response.json({
      success: true,
      data: null,
      error: null,
    })
  })
}

export const createStatusActionsHandler = (issues: MockIssue[] = createMockIssues()): ReturnType<typeof http.post> =>
  http.post('*/api/v1/issues/status-actions/resolve', async ({ request }) => {
    const body = (await request.json()) as { issueId?: number; currentStatusId?: string }
    const statusProperty = defaultProperties.find(property => property.id === SystemPropertyId.STATUS)
    const config = statusProperty ? getStatusPropertyConfig(statusProperty) : null

    if (!config) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_STATUS_CONFIG',
            message: 'Status config is invalid',
          },
        },
        { status: 500 },
      )
    }

    const currentStatusId =
      body.issueId !== undefined
        ? ((issues
            .find(issue => issue.issueId === body.issueId)
            ?.propertyValues.find(propertyValue => propertyValue.propertyId === SystemPropertyId.STATUS)?.value as
            | string
            | undefined) ?? config.initialStatusId)
        : (body.currentStatusId ?? config.initialStatusId)

    return Response.json({
      success: true,
      data: {
        currentStatusId,
        actions: resolveStatusActions(config, currentStatusId),
      },
      error: null,
    })
  })

export const createIssueActivitiesHandler = ({
  activities = [],
  subscriberIds = [],
}: CreateIssueActivitiesHandlerOptions = {}): ReturnType<typeof http.get> =>
  http.get('*/api/v1/issues/:issueId/activities', ({ params }) => {
    const issueId = Number(params.issueId)
    const filteredActivities = activities.filter(activity => activity.issueId === issueId)

    return Response.json({
      success: true,
      data: {
        total: filteredActivities.length,
        activities: filteredActivities,
        subscribers: subscriberIds,
      },
      error: null,
    })
  })

export const createSubscribeIssueHandler = (subscriberIds: string[] = []): ReturnType<typeof http.post> =>
  http.post('*/api/v1/issues/:issueId/activities/subscribers', async ({ request }) => {
    const body = (await request.json()) as { userIds?: string[] }
    const userIds = Array.isArray(body.userIds) ? body.userIds : []

    for (const userId of userIds) {
      if (!subscriberIds.includes(userId)) {
        subscriberIds.push(userId)
      }
    }

    return Response.json({
      success: true,
      data: null,
      error: null,
    })
  })

export const createUnsubscribeIssueHandler = (subscriberIds: string[] = []): ReturnType<typeof http.delete> =>
  http.delete('*/api/v1/issues/:issueId/activities/subscribers', ({ request }) => {
    const url = new URL(request.url)
    const userIds = (url.searchParams.get('userIds') ?? '').split(',').filter(Boolean)

    for (const userId of userIds) {
      const index = subscriberIds.indexOf(userId)
      if (index >= 0) {
        subscriberIds.splice(index, 1)
      }
    }

    return Response.json({
      success: true,
      data: null,
      error: null,
    })
  })

export const createIssueCommentsHandler = (comments: Comment[] = []): ReturnType<typeof http.get> =>
  http.get('*/api/v1/issues/:issueId/comments', ({ params }) => {
    const issueId = Number(params.issueId)

    return Response.json({
      success: true,
      data: {
        comments: comments.filter(comment => comment.issueId === issueId),
      },
      error: null,
    })
  })

export const createIssueCommentHandler = (
  comments: Comment[] = [],
  activities: Activity[] = [],
): ReturnType<typeof http.post> =>
  http.post('*/api/v1/issues/:issueId/comments', async ({ params, request }) => {
    const issueId = Number(params.issueId)
    const body = (await request.json()) as { content?: string }
    const now = Date.now()
    const comment: Comment = {
      id: `comment-${comments.length + 1}`,
      issueId,
      content: body.content ?? '',
      createdBy: 'user-1',
      parentId: null,
      createdAt: now,
      updatedAt: now,
      subComments: [],
    }

    comments.push(comment)
    activities.push({
      id: `activity-${activities.length + 1}`,
      issueId,
      type: ActivityType.COMMENT,
      payload: comment,
      createdBy: comment.createdBy,
      createdAt: now,
      updatedAt: now,
    })

    return Response.json({
      success: true,
      data: { comment },
      error: null,
    })
  })
