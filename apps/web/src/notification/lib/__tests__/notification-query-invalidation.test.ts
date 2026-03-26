import { describe, expect, it } from 'vitest'

import { NotificationChannelType, NotificationType } from '@repo/shared'
import {
  buildNotificationBatchQueryKeysToInvalidate,
  buildNotificationQueryKeysToInvalidate,
} from '../notification-query-invalidation'
import type { InboxNotificationListItem } from '@repo/shared'

const WORKSPACE_ID = 'default-workspace-id'

const makeIssueUpdatedItem = (
  overrides: Partial<Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }>> = {},
): Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }> => ({
  deliveryId: 'delivery-issue-updated',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.ISSUE_UPDATED,
  createdAt: Date.now(),
  readAt: null,
  payload: {
    actor: null,
    issue: {
      issueId: 42,
      title: 'Issue updated',
    },
    changedProperties: [{ propertyId: 'status', name: 'Status' }],
  },
  ...overrides,
})

const makeCommentCreatedItem = (
  overrides: Partial<Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }>> = {},
): Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }> => ({
  deliveryId: 'delivery-comment-created',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.COMMENT_CREATED,
  createdAt: Date.now(),
  readAt: null,
  payload: {
    actor: null,
    issue: {
      issueId: 7,
      title: 'Comment created',
    },
    comment: {
      commentId: 'comment-1',
      excerpt: 'A new comment',
    },
  },
  ...overrides,
})

const makeIssueDeletedItem = (
  overrides: Partial<Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_DELETED }>> = {},
): Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_DELETED }> => ({
  deliveryId: 'delivery-issue-deleted',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.ISSUE_DELETED,
  createdAt: Date.now(),
  readAt: null,
  payload: {
    actor: null,
    issue: {
      issueId: 99,
      title: 'Issue deleted',
    },
  },
  ...overrides,
})

describe('buildNotificationQueryKeysToInvalidate', () => {
  it('maps issue.updated notifications to issue detail, activities, and issue list keys', () => {
    expect(buildNotificationQueryKeysToInvalidate(makeIssueUpdatedItem(), WORKSPACE_ID)).toEqual([
      ['api-server', 'issue', 42],
      ['api-server', 'issueActivities', 42],
      ['api-server', 'issues', WORKSPACE_ID],
      ['api-server', 'issues-infinite', WORKSPACE_ID],
    ])
  })

  it('maps comment.created notifications to comment and activity keys', () => {
    expect(buildNotificationQueryKeysToInvalidate(makeCommentCreatedItem(), WORKSPACE_ID)).toEqual([
      ['api-server', 'issueComments', 7],
      ['api-server', 'issueActivities', 7],
    ])
  })

  it('maps issue.deleted notifications to issue detail, related issue data, and issue list keys', () => {
    expect(buildNotificationQueryKeysToInvalidate(makeIssueDeletedItem(), WORKSPACE_ID)).toEqual([
      ['api-server', 'issue', 99],
      ['api-server', 'issueActivities', 99],
      ['api-server', 'issueComments', 99],
      ['api-server', 'issues', WORKSPACE_ID],
      ['api-server', 'issues-infinite', WORKSPACE_ID],
    ])
  })
})

describe('buildNotificationBatchQueryKeysToInvalidate', () => {
  it('deduplicates overlapping invalidation keys across multiple notifications', () => {
    const items: InboxNotificationListItem[] = [
      makeIssueUpdatedItem(),
      makeIssueUpdatedItem({ deliveryId: 'delivery-issue-updated-2' }),
      makeCommentCreatedItem({
        payload: {
          actor: null,
          issue: { issueId: 42, title: 'Issue updated' },
          comment: { commentId: 'comment-2', excerpt: 'second' },
        },
      }),
    ]

    expect(buildNotificationBatchQueryKeysToInvalidate(items, WORKSPACE_ID)).toEqual([
      ['api-server', 'issue', 42],
      ['api-server', 'issueActivities', 42],
      ['api-server', 'issues', WORKSPACE_ID],
      ['api-server', 'issues-infinite', WORKSPACE_ID],
      ['api-server', 'issueComments', 42],
    ])
  })
})
