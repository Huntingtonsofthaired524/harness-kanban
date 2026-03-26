import { describe, expect, it } from 'vitest'

import { NotificationChannelType, NotificationType } from '@repo/shared'
import { getDesktopNotificationContent, getNewUnreadInboxNotifications } from '../desktop-notifications'
import type { InboxNotificationListItem } from '@repo/shared'

const makeIssueUpdatedItem = (
  overrides: Partial<Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }>> = {},
): Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }> => ({
  deliveryId: 'delivery-issue-updated',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.ISSUE_UPDATED,
  createdAt: Date.now(),
  readAt: null,
  payload: {
    actor: {
      id: 'user-1',
      username: 'Taylor',
      imageUrl: 'https://example.com/avatar.png',
      hasImage: true,
    },
    issue: {
      issueId: 42,
      title: 'Inbox desktop notifications',
    },
    changedProperties: [
      { propertyId: 'status', name: 'Status' },
      { propertyId: 'assignee', name: 'Assignee' },
    ],
  },
  ...overrides,
})

const makeCommentItem = (
  overrides: Partial<Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }>> = {},
): Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }> => ({
  deliveryId: 'delivery-comment',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.COMMENT_CREATED,
  createdAt: Date.now(),
  readAt: null,
  payload: {
    actor: {
      id: 'user-2',
      username: 'Jordan',
      imageUrl: '',
      hasImage: false,
    },
    issue: {
      issueId: 7,
      title: 'Comment notification copy',
    },
    comment: {
      commentId: 'comment-1',
      excerpt: 'Please check the latest reproduction notes.',
    },
  },
  ...overrides,
})

describe('getDesktopNotificationContent', () => {
  it('builds issue update notification copy', () => {
    expect(getDesktopNotificationContent(makeIssueUpdatedItem())).toEqual({
      title: 'Taylor updated an issue',
      body: '#42 Inbox desktop notifications\nStatus, Assignee',
      icon: 'https://example.com/avatar.png',
    })
  })

  it('builds comment notification copy without an icon fallback', () => {
    expect(getDesktopNotificationContent(makeCommentItem())).toEqual({
      title: 'Jordan added a comment',
      body: '#7 Comment notification copy\nPlease check the latest reproduction notes.',
      icon: undefined,
    })
  })
})

describe('getNewUnreadInboxNotifications', () => {
  it('returns unread items newer than the last seen delivery in chronological order', () => {
    const items: InboxNotificationListItem[] = [
      makeCommentItem({ deliveryId: 'delivery-3' }),
      makeIssueUpdatedItem({ deliveryId: 'delivery-2' }),
      makeIssueUpdatedItem({ deliveryId: 'delivery-1', readAt: Date.now() }),
      makeCommentItem({ deliveryId: 'delivery-0' }),
    ]

    expect(getNewUnreadInboxNotifications(items, 'delivery-1').map(item => item.deliveryId)).toEqual([
      'delivery-2',
      'delivery-3',
    ])
  })

  it('returns an empty list until a baseline delivery has been recorded', () => {
    expect(getNewUnreadInboxNotifications([makeIssueUpdatedItem()], null)).toEqual([])
  })
})
