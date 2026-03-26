import { http } from 'msw/core/http'
import React from 'react'

import { InboxNotificationListItem, NotificationChannelType, NotificationType } from '@repo/shared'
import { NotificationBell } from './notification-bell'
import type { Meta, StoryObj } from '@storybook/nextjs'

const now = Date.now()

const notificationItems: InboxNotificationListItem[] = [
  {
    deliveryId: 'story-delivery-1',
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
        issueId: 32,
        title: 'Dark mode spacing regression',
      },
      changedProperties: [
        { propertyId: 'status', name: 'Status' },
        { propertyId: 'assignee', name: 'Assignee' },
      ],
    },
  },
  {
    deliveryId: 'story-delivery-2',
    channelType: NotificationChannelType.INBOX,
    type: NotificationType.COMMENT_CREATED,
    createdAt: now - 1000 * 60 * 10,
    readAt: null,
    payload: {
      actor: {
        id: 'user-2',
        username: 'Jordan',
        imageUrl: '',
        hasImage: false,
      },
      issue: {
        issueId: 17,
        title: 'Desktop alerts copy polish',
      },
      comment: {
        commentId: 'comment-1',
        excerpt: 'The prompt text looks good. We should keep it short and actionable.',
      },
    },
  },
]

const makeSuccessResponse = <T,>(data: T) => ({
  success: true as const,
  data,
  error: null,
})

const createUnreadCountHandler = (unreadCount = 2) =>
  http.get('*/api/v1/notifications/inbox/unread-count', () =>
    Response.json(
      makeSuccessResponse({
        unreadCount,
      }),
    ),
  )

const createInboxHandler = (items: InboxNotificationListItem[] = notificationItems) =>
  http.get('*/api/v1/notifications/inbox', ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') ?? items.length)

    return Response.json(
      makeSuccessResponse({
        items: items.slice(0, limit),
        nextCursor: null,
      }),
    )
  })

const createMarkReadHandler = () =>
  http.patch('*/api/v1/notifications/inbox/:deliveryId/read', ({ params }) =>
    Response.json(
      makeSuccessResponse({
        deliveryId: String(params.deliveryId),
        readAt: Date.now(),
      }),
    ),
  )

const createMarkAllReadHandler = () =>
  http.patch('*/api/v1/notifications/inbox/read-all', () =>
    Response.json(
      makeSuccessResponse({
        updatedCount: notificationItems.filter(item => item.readAt === null).length,
      }),
    ),
  )

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

const queryButtonByText = (root: ParentNode, label: string): HTMLButtonElement | null =>
  Array.from(root.querySelectorAll('button')).find(button =>
    button.textContent?.includes(label),
  ) as HTMLButtonElement | null

const NotificationBellStoryShell = ({
  initialPermission = 'default',
  requestPermissionResult = 'granted',
}: {
  initialPermission?: NotificationPermission
  requestPermissionResult?: NotificationPermission
}) => {
  React.useLayoutEffect(() => {
    const originalNotification = window.Notification

    class MockNotification {
      static permission = initialPermission

      static requestPermission = async () => {
        MockNotification.permission = requestPermissionResult
        return requestPermissionResult
      }

      onclick: Notification['onclick'] = null

      constructor(_title: string, _options?: NotificationOptions) {}

      close() {}
    }

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      writable: true,
      value: MockNotification,
    })

    return () => {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: originalNotification,
      })
    }
  }, [initialPermission, requestPermissionResult])

  return (
    <div className="bg-sidebar flex min-h-40 items-center justify-center rounded-3xl p-6">
      <NotificationBell />
    </div>
  )
}

const meta: Meta<typeof NotificationBellStoryShell> = {
  title: 'Notification/Bell',
  component: NotificationBellStoryShell,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: {
        notifications: [
          createUnreadCountHandler(),
          createInboxHandler(),
          createMarkReadHandler(),
          createMarkAllReadHandler(),
        ],
      },
    },
  },
  args: {
    initialPermission: 'default',
    requestPermissionResult: 'granted',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const PermissionPrompt: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const ownerDocument = canvasElement.ownerDocument
    await waitForCondition(() => Boolean(canvasElement.querySelector('[aria-label="Notifications"]')))

    const notificationButton = canvasElement.querySelector('[aria-label="Notifications"]') as HTMLElement | null

    if (!notificationButton) {
      throw new Error('Expected the notification trigger to render.')
    }

    await waitForCondition(() => notificationButton.textContent?.includes('2') ?? false)

    await userEvent.click(notificationButton)
    await waitForCondition(() => Boolean(ownerDocument.querySelector('[role="dialog"]')))
    await waitForCondition(() => Boolean(queryButtonByText(ownerDocument, 'Enable desktop alerts')))
  },
}

export const EnableFromPrompt: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const ownerDocument = canvasElement.ownerDocument
    await waitForCondition(() => Boolean(canvasElement.querySelector('[aria-label="Notifications"]')))

    const notificationButton = canvasElement.querySelector('[aria-label="Notifications"]') as HTMLElement | null

    if (!notificationButton) {
      throw new Error('Expected the notification trigger to render.')
    }

    await userEvent.click(notificationButton)
    await waitForCondition(() => Boolean(queryButtonByText(ownerDocument, 'Enable desktop alerts')))

    const enableButton = queryButtonByText(ownerDocument, 'Enable desktop alerts')
    if (!enableButton) {
      throw new Error('Expected the enable desktop alerts button to render.')
    }

    await userEvent.click(enableButton)

    await waitForCondition(() => !ownerDocument.body.textContent?.includes('Enable desktop alerts'))
  },
}

export const AlreadyGranted: Story = {
  args: {
    initialPermission: 'granted',
  },
  play: async ({ canvasElement, userEvent }) => {
    const ownerDocument = canvasElement.ownerDocument
    await waitForCondition(() => Boolean(canvasElement.querySelector('[aria-label="Notifications"]')))

    const notificationButton = canvasElement.querySelector('[aria-label="Notifications"]') as HTMLElement | null

    if (!notificationButton) {
      throw new Error('Expected the notification trigger to render.')
    }

    await userEvent.click(notificationButton)
    await waitForCondition(() => Boolean(ownerDocument.querySelector('[role="dialog"]')))

    if (ownerDocument.body.textContent?.includes('Enable desktop alerts')) {
      throw new Error('Did not expect the desktop alert prompt once permission is granted.')
    }
  },
}
