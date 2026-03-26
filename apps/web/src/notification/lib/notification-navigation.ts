import { InboxNotificationListItem, NotificationType } from '@repo/shared'

export const getNotificationHref = (item: InboxNotificationListItem): string | null => {
  switch (item.type) {
    case NotificationType.ISSUE_UPDATED:
    case NotificationType.COMMENT_CREATED:
      return `/issues/${item.payload.issue.issueId}`
    case NotificationType.ISSUE_DELETED:
      return null
  }
}
