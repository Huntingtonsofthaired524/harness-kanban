import { NotificationType } from '@repo/shared'
import type { InboxNotificationListItem } from '@repo/shared'
import type { QueryKey } from '@tanstack/react-query'

const dedupeQueryKeys = (queryKeys: QueryKey[]): QueryKey[] => {
  const seen = new Set<string>()

  return queryKeys.filter(queryKey => {
    const key = JSON.stringify(queryKey)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const buildNotificationQueryKeysToInvalidate = (
  item: InboxNotificationListItem,
  workspaceId: string,
): QueryKey[] => {
  const issueId = item.payload.issue.issueId

  switch (item.type) {
    case NotificationType.ISSUE_UPDATED:
      return [
        ['api-server', 'issue', issueId],
        ['api-server', 'issueActivities', issueId],
        ['api-server', 'issues', workspaceId],
        ['api-server', 'issues-infinite', workspaceId],
      ]
    case NotificationType.COMMENT_CREATED:
      return [
        ['api-server', 'issueComments', issueId],
        ['api-server', 'issueActivities', issueId],
      ]
    case NotificationType.ISSUE_DELETED:
      return [
        ['api-server', 'issue', issueId],
        ['api-server', 'issueActivities', issueId],
        ['api-server', 'issueComments', issueId],
        ['api-server', 'issues', workspaceId],
        ['api-server', 'issues-infinite', workspaceId],
      ]
  }
}

export const buildNotificationBatchQueryKeysToInvalidate = (
  items: InboxNotificationListItem[],
  workspaceId: string,
): QueryKey[] => dedupeQueryKeys(items.flatMap(item => buildNotificationQueryKeysToInvalidate(item, workspaceId)))
