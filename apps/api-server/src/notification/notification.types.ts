import { NotificationChannelType, NotificationType } from '@repo/shared'
import type { NotificationPayloadMap } from '@repo/shared'

export interface DeliverNotificationRequest {
  notificationPayloadId: string
  userIds: string[]
}

export interface NotificationChannelHandler {
  channelType: NotificationChannelType
  deliver(request: DeliverNotificationRequest): Promise<void>
}

export interface CreateNotificationRequest<T extends NotificationType = NotificationType> {
  workspaceId: string
  type: T
  payload: NotificationPayloadMap[T]
  recipientIds: string[]
  channelTypes?: NotificationChannelType[]
}

export interface ListInboxNotificationsOptions {
  cursor?: string
  limit?: number
}
