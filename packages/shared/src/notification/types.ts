import { User } from '../lib/types'
import { NotificationChannelType, NotificationType } from './constants'

export type NotificationActor = User

export interface NotificationIssueReference {
  issueId: number
  title: string
}

export interface NotificationChangedProperty {
  propertyId: string
  name: string
}

export interface NotificationCommentReference {
  commentId: string
  parentId?: string | null
  excerpt: string
}

export interface IssueUpdatedNotificationPayload {
  actor?: NotificationActor | null
  issue: NotificationIssueReference
  changedProperties: NotificationChangedProperty[]
}

export interface IssueDeletedNotificationPayload {
  actor?: NotificationActor | null
  issue: NotificationIssueReference
}

export interface CommentCreatedNotificationPayload {
  actor?: NotificationActor | null
  issue: NotificationIssueReference
  comment: NotificationCommentReference
}

export interface NotificationPayloadMap {
  [NotificationType.ISSUE_UPDATED]: IssueUpdatedNotificationPayload
  [NotificationType.ISSUE_DELETED]: IssueDeletedNotificationPayload
  [NotificationType.COMMENT_CREATED]: CommentCreatedNotificationPayload
}

export type NotificationPayload = NotificationPayloadMap[NotificationType]

export type InboxNotificationListItem = {
  [T in NotificationType]: {
    deliveryId: string
    channelType: NotificationChannelType.INBOX
    type: T
    payload: NotificationPayloadMap[T]
    readAt: number | null
    createdAt: number
  }
}[NotificationType]

export interface GetInboxNotificationsResponse {
  items: InboxNotificationListItem[]
  nextCursor: string | null
}

export interface GetUnreadNotificationCountResponse {
  unreadCount: number
}

export interface MarkNotificationReadResponse {
  deliveryId: string
  readAt: number | null
}

export interface MarkAllNotificationsReadResponse {
  updatedCount: number
}
