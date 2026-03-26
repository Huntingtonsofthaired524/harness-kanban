import React from 'react'

import { InboxNotificationListItem, NotificationChannelType, NotificationType } from '@repo/shared'
import { NotificationInboxPanelView } from './notification-inbox-panel'
import type { Meta, StoryObj } from '@storybook/nextjs'

const now = Date.now()

const sampleItems: InboxNotificationListItem[] = [
  {
    deliveryId: 'delivery-1',
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
      ],
    },
  },
  {
    deliveryId: 'delivery-2',
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
  },
  {
    deliveryId: 'delivery-3',
    channelType: NotificationChannelType.INBOX,
    type: NotificationType.ISSUE_DELETED,
    createdAt: now - 1000 * 60 * 60,
    readAt: now - 1000 * 60 * 5,
    payload: {
      actor: {
        id: 'user-3',
        username: 'Morgan',
        imageUrl: '',
        hasImage: false,
      },
      issue: {
        issueId: 19,
        title: 'Legacy webhook integration cleanup',
      },
    },
  },
]

const meta: Meta<typeof NotificationInboxPanelView> = {
  title: 'Notification/InboxPanel',
  component: NotificationInboxPanelView,
  parameters: {
    layout: 'centered',
  },
  args: {
    items: sampleItems,
    unreadCount: 2,
    desktopNotificationPermission: 'granted',
    isRequestingDesktopNotificationPermission: false,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    isMarkAllPending: false,
    onEnableDesktopNotifications: () => {},
    onSelect: () => {},
    onMarkRead: () => {},
    onMarkAllRead: () => {},
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

export const Populated: Story = {
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Inbox') ?? false)

    assertElement(canvasElement.textContent?.includes('Inbox'), 'Expected the inbox heading to render.')
    assertElement(
      canvasElement.textContent?.includes('Taylor updated an issue'),
      'Expected issue update item to render.',
    )
    assertElement(canvasElement.textContent?.includes('Jordan added a comment'), 'Expected comment item to render.')
    assertElement(
      canvasElement.textContent?.includes('Morgan removed an issue'),
      'Expected issue deletion item to render.',
    )
  },
}

export const Loading: Story = {
  args: {
    items: [],
    unreadCount: 0,
    isLoading: true,
    hasNextPage: false,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.querySelectorAll('[data-slot="skeleton"]').length > 0)

    assertElement(canvasElement.querySelectorAll('[data-slot="skeleton"]').length > 0, 'Expected loading skeletons.')
  },
}

export const Empty: Story = {
  args: {
    items: [],
    unreadCount: 0,
    isLoading: false,
    hasNextPage: false,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('No notifications yet') ?? false)

    assertElement(canvasElement.textContent?.includes('No notifications yet'), 'Expected empty state to render.')
    assertElement(canvasElement.textContent?.includes('All caught up'), 'Expected empty-state subtitle to render.')
  },
}

export const DesktopAlertsPrompt: Story = {
  args: {
    desktopNotificationPermission: 'default',
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Desktop notifications') ?? false)

    assertElement(
      canvasElement.textContent?.includes('Desktop notifications'),
      'Expected the desktop notifications callout.',
    )
    assertElement(
      canvasElement.textContent?.includes('Enable desktop alerts'),
      'Expected the enable desktop alerts button.',
    )
  },
}

export const DesktopAlertsBlocked: Story = {
  args: {
    desktopNotificationPermission: 'denied',
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(
      () => canvasElement.textContent?.includes('Desktop notifications are blocked for this site.') ?? false,
    )

    assertElement(
      canvasElement.textContent?.includes('Desktop notifications are blocked for this site.'),
      'Expected the blocked desktop notification helper text.',
    )
  },
}
