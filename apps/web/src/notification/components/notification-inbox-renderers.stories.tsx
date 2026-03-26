import React from 'react'

import { InboxNotificationListItem, NotificationChannelType, NotificationType } from '@repo/shared'
import { renderNotificationItem } from './notification-inbox-renderers'
import type { Meta, StoryObj } from '@storybook/nextjs'

interface NotificationRendererPreviewProps {
  item: InboxNotificationListItem
}

const NotificationRendererPreview: React.FC<NotificationRendererPreviewProps> = ({ item }) => (
  <div className="bg-background w-[22rem] rounded-2xl border p-4 shadow-sm">{renderNotificationItem(item)}</div>
)

const now = Date.now()

const issueUpdatedItem: Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }> = {
  deliveryId: 'delivery-issue-updated',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.ISSUE_UPDATED,
  createdAt: now,
  readAt: null,
  payload: {
    actor: {
      id: 'user-1',
      username: 'Taylor',
      imageUrl: '',
      hasImage: false,
    },
    issue: {
      issueId: 128,
      title: 'Auth token refresh fails after tab wake-up',
    },
    changedProperties: [
      { propertyId: 'title', name: 'Title' },
      { propertyId: 'status', name: 'Status' },
      { propertyId: 'assignee', name: 'Assignee' },
      { propertyId: 'priority', name: 'Priority' },
      { propertyId: 'severity', name: 'Severity' },
    ],
  },
}

const commentCreatedItem: Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }> = {
  deliveryId: 'delivery-comment-created',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.COMMENT_CREATED,
  createdAt: now - 1000 * 60 * 20,
  readAt: null,
  payload: {
    actor: {
      id: 'user-2',
      username: 'Jordan',
      imageUrl: '',
      hasImage: false,
    },
    issue: {
      issueId: 64,
      title: 'Sidebar layout breaks on narrow screens',
    },
    comment: {
      commentId: 'comment-1',
      excerpt: 'I can reproduce this on Safari. The layout snaps back after a hard refresh.',
    },
  },
}

const issueDeletedItem: Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_DELETED }> = {
  deliveryId: 'delivery-issue-deleted',
  channelType: NotificationChannelType.INBOX,
  type: NotificationType.ISSUE_DELETED,
  createdAt: now - 1000 * 60 * 60,
  readAt: now - 1000 * 60 * 5,
  payload: {
    actor: null,
    issue: {
      issueId: 19,
      title: 'Legacy webhook integration cleanup',
    },
  },
}

const meta: Meta<typeof NotificationRendererPreview> = {
  title: 'Notification/InboxRenderers',
  component: NotificationRendererPreview,
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof meta>

const assertElement = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

const waitForCondition = async (predicate: () => boolean, timeoutMs = 1500, intervalMs = 50) => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (predicate()) {
      return
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Timed out waiting for condition.')
}

export const IssueUpdated: Story = {
  args: {
    item: issueUpdatedItem,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Issue updated') ?? false)

    assertElement(canvasElement.textContent?.includes('Issue updated'), 'Expected the issue updated badge.')
    assertElement(canvasElement.textContent?.includes('Taylor updated an issue'), 'Expected the actor label.')
    assertElement(canvasElement.textContent?.includes('Auth token refresh fails after tab wake-up'), 'Expected title.')
    assertElement(canvasElement.textContent?.includes('+1'), 'Expected the overflow property badge.')
  },
}

export const CommentCreated: Story = {
  args: {
    item: commentCreatedItem,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('New comment') ?? false)

    assertElement(canvasElement.textContent?.includes('New comment'), 'Expected the comment badge.')
    assertElement(canvasElement.textContent?.includes('Jordan added a comment'), 'Expected the actor label.')
    assertElement(
      canvasElement.textContent?.includes('Sidebar layout breaks on narrow screens'),
      'Expected issue title.',
    )
  },
}

export const IssueDeleted: Story = {
  args: {
    item: issueDeletedItem,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Issue deleted') ?? false)

    assertElement(canvasElement.textContent?.includes('Issue deleted'), 'Expected the issue deleted badge.')
    assertElement(canvasElement.textContent?.includes('System removed an issue'), 'Expected system fallback label.')
    assertElement(
      canvasElement.textContent?.includes('This issue is no longer available.'),
      'Expected deleted issue helper text.',
    )
  },
}
