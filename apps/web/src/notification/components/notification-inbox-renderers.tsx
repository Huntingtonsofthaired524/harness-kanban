'use client'

import React from 'react'

import { Badge } from '@/components/ui/badge'
import { InboxNotificationListItem, NotificationChannelType, NotificationType } from '@repo/shared'

const actorLabel = (item: InboxNotificationListItem) => item.payload.actor?.username ?? 'System'

const renderIssueUpdatedNotification = (
  item: Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }>,
) => (
  <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
        Issue updated
      </Badge>
      <span className="text-sm font-medium">{actorLabel(item)} updated an issue</span>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold">
        #{item.payload.issue.issueId} {item.payload.issue.title}
      </p>
      <div className="flex flex-wrap gap-1">
        {item.payload.changedProperties.slice(0, 4).map(property => (
          <Badge key={property.propertyId} variant="outline" className="bg-background">
            {property.name}
          </Badge>
        ))}
        {item.payload.changedProperties.length > 4 && (
          <Badge variant="outline" className="bg-background">
            +{item.payload.changedProperties.length - 4}
          </Badge>
        )}
      </div>
    </div>
  </div>
)

const renderIssueDeletedNotification = (
  item: Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_DELETED }>,
) => (
  <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        Issue deleted
      </Badge>
      <span className="text-sm font-medium">{actorLabel(item)} removed an issue</span>
    </div>
    <div className="rounded-xl border border-dashed border-amber-300/70 bg-amber-50/60 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/20">
      <p className="text-sm font-semibold">
        #{item.payload.issue.issueId} {item.payload.issue.title}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">This issue is no longer available.</p>
    </div>
  </div>
)

const renderCommentCreatedNotification = (
  item: Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }>,
) => (
  <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="secondary"
        className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
        New comment
      </Badge>
      <span className="text-sm font-medium">{actorLabel(item)} added a comment</span>
    </div>
    <div className="space-y-2">
      <p className="text-sm font-semibold">
        #{item.payload.issue.issueId} {item.payload.issue.title}
      </p>
      <div className="bg-muted/70 rounded-xl px-3 py-2 text-sm italic leading-6">
        <span aria-hidden="true">&ldquo;</span>
        {item.payload.comment.excerpt}
        <span aria-hidden="true">&rdquo;</span>
      </div>
    </div>
  </div>
)

export const notificationRenderers = {
  [NotificationChannelType.INBOX]: {
    [NotificationType.ISSUE_UPDATED]: (item: InboxNotificationListItem) =>
      renderIssueUpdatedNotification(
        item as Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_UPDATED }>,
      ),
    [NotificationType.ISSUE_DELETED]: (item: InboxNotificationListItem) =>
      renderIssueDeletedNotification(
        item as Extract<InboxNotificationListItem, { type: NotificationType.ISSUE_DELETED }>,
      ),
    [NotificationType.COMMENT_CREATED]: (item: InboxNotificationListItem) =>
      renderCommentCreatedNotification(
        item as Extract<InboxNotificationListItem, { type: NotificationType.COMMENT_CREATED }>,
      ),
  },
} satisfies Record<
  NotificationChannelType,
  Record<NotificationType, (item: InboxNotificationListItem) => React.ReactNode>
>

export const renderNotificationItem = (item: InboxNotificationListItem) =>
  notificationRenderers[item.channelType][item.type](item)
