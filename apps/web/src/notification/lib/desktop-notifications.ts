import { InboxNotificationListItem, NotificationType } from '@repo/shared'

export type DesktopNotificationPermissionState = NotificationPermission | 'unsupported'

export interface DesktopNotificationContent {
  title: string
  body: string
  icon?: string
}

const getActorLabel = (item: InboxNotificationListItem) => item.payload.actor?.username ?? 'System'

const getIssueLabel = (item: InboxNotificationListItem) =>
  `#${item.payload.issue.issueId} ${item.payload.issue.title}`.trim()

export const isDesktopNotificationSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  typeof window.Notification?.requestPermission === 'function'

export const getDesktopNotificationPermission = (): DesktopNotificationPermissionState => {
  if (!isDesktopNotificationSupported()) {
    return 'unsupported'
  }

  return window.Notification.permission
}

export const getDesktopNotificationContent = (item: InboxNotificationListItem): DesktopNotificationContent => {
  const actorLabel = getActorLabel(item)
  const icon = item.payload.actor?.imageUrl || undefined

  switch (item.type) {
    case NotificationType.ISSUE_UPDATED:
      return {
        title: `${actorLabel} updated an issue`,
        body: `${getIssueLabel(item)}\n${item.payload.changedProperties.map(property => property.name).join(', ')}`,
        icon,
      }
    case NotificationType.ISSUE_DELETED:
      return {
        title: `${actorLabel} deleted an issue`,
        body: getIssueLabel(item),
        icon,
      }
    case NotificationType.COMMENT_CREATED:
      return {
        title: `${actorLabel} added a comment`,
        body: `${getIssueLabel(item)}\n${item.payload.comment.excerpt}`,
        icon,
      }
  }
}

export const getNewUnreadInboxNotifications = (
  items: InboxNotificationListItem[],
  lastSeenDeliveryId: string | null,
): InboxNotificationListItem[] => {
  if (!lastSeenDeliveryId) {
    return []
  }

  const newItems: InboxNotificationListItem[] = []

  for (const item of items) {
    if (item.deliveryId === lastSeenDeliveryId) {
      break
    }

    if (item.readAt === null) {
      newItems.push(item)
    }
  }

  return newItems.reverse()
}
