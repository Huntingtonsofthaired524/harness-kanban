import { PrismaService } from '@/database/prisma.service'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@repo/database'
import { DEFAULT_INBOX_NOTIFICATIONS_PAGE_SIZE, NotificationChannelType, NotificationType } from '@repo/shared'
import { NOTIFICATION_CHANNEL_HANDLERS } from './notification.constants'
import {
  CreateNotificationRequest,
  ListInboxNotificationsOptions,
  NotificationChannelHandler,
} from './notification.types'
import type {
  GetInboxNotificationsResponse,
  GetUnreadNotificationCountResponse,
  InboxNotificationListItem,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationPayloadMap,
} from '@repo/shared'

type InboxCursor = {
  createdAt: string
  id: string
}

type InboxNotificationRecord = {
  id: string
  channel_type: string
  read_at: Date | null
  created_at: Date
  notification_payload: {
    type: string
    payload: unknown
  }
}

@Injectable()
export class NotificationService {
  private readonly handlersByChannel: Map<NotificationChannelType, NotificationChannelHandler>

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_CHANNEL_HANDLERS) handlers: NotificationChannelHandler[],
  ) {
    this.handlersByChannel = new Map(handlers.map(handler => [handler.channelType, handler]))
  }

  async createNotification<T extends NotificationType>({
    workspaceId,
    type,
    payload,
    recipientIds,
    channelTypes = [NotificationChannelType.INBOX],
  }: CreateNotificationRequest<T>): Promise<void> {
    const normalizedRecipientIds = this.filterRecipientIds(recipientIds)
    if (normalizedRecipientIds.length === 0) {
      return
    }

    const notificationPayload = await this.prisma.client.notification_payload.create({
      data: {
        workspace_id: workspaceId,
        type,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    })

    await Promise.all(
      channelTypes.map(channelType =>
        this.getHandler(channelType).deliver({
          notificationPayloadId: notificationPayload.id,
          userIds: normalizedRecipientIds,
        }),
      ),
    )
  }

  async listInboxNotifications(
    userId: string,
    { cursor, limit = DEFAULT_INBOX_NOTIFICATIONS_PAGE_SIZE }: ListInboxNotificationsOptions = {},
  ): Promise<GetInboxNotificationsResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 50)
    const parsedCursor = cursor ? this.decodeCursor(cursor) : null
    const where: Prisma.notification_deliveryWhereInput = {
      user_id: userId,
      channel_type: NotificationChannelType.INBOX,
      ...(parsedCursor
        ? {
            OR: [
              {
                created_at: {
                  lt: new Date(parsedCursor.createdAt),
                },
              },
              {
                AND: [
                  {
                    created_at: new Date(parsedCursor.createdAt),
                  },
                  {
                    id: {
                      lt: parsedCursor.id,
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    }

    const deliveries = await this.prisma.client.notification_delivery.findMany({
      where,
      include: {
        notification_payload: {
          select: {
            type: true,
            payload: true,
          },
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: safeLimit + 1,
    })

    const hasNextPage = deliveries.length > safeLimit
    const pageItems = deliveries.slice(0, safeLimit)
    const lastItem = pageItems.at(-1)

    return {
      items: pageItems.map(delivery => this.mapInboxNotification(delivery)),
      nextCursor: hasNextPage && lastItem ? this.encodeCursor(lastItem) : null,
    }
  }

  async getUnreadInboxCount(userId: string): Promise<GetUnreadNotificationCountResponse> {
    const unreadCount = await this.prisma.client.notification_delivery.count({
      where: {
        user_id: userId,
        channel_type: NotificationChannelType.INBOX,
        read_at: null,
      },
    })

    return { unreadCount }
  }

  async markInboxNotificationRead(userId: string, deliveryId: string): Promise<MarkNotificationReadResponse> {
    const delivery = await this.prisma.client.notification_delivery.findFirst({
      where: {
        id: deliveryId,
        user_id: userId,
        channel_type: NotificationChannelType.INBOX,
      },
      select: {
        id: true,
        read_at: true,
      },
    })

    if (!delivery) {
      throw new NotFoundException('Notification not found')
    }

    if (delivery.read_at) {
      return {
        deliveryId: delivery.id,
        readAt: delivery.read_at.getTime(),
      }
    }

    const updatedDelivery = await this.prisma.client.notification_delivery.update({
      where: {
        id: deliveryId,
      },
      data: {
        read_at: new Date(),
      },
      select: {
        id: true,
        read_at: true,
      },
    })

    return {
      deliveryId: updatedDelivery.id,
      readAt: updatedDelivery.read_at?.getTime() ?? null,
    }
  }

  async markAllInboxNotificationsRead(userId: string): Promise<MarkAllNotificationsReadResponse> {
    const result = await this.prisma.client.notification_delivery.updateMany({
      where: {
        user_id: userId,
        channel_type: NotificationChannelType.INBOX,
        read_at: null,
      },
      data: {
        read_at: new Date(),
      },
    })

    return {
      updatedCount: result.count,
    }
  }

  async getIssueSubscriberIds(issueId: number, actorId?: string): Promise<string[]> {
    const subscriptions = await this.prisma.client.subscription.findMany({
      where: {
        issue_id: issueId,
        comment_id: null,
      },
      select: {
        user_id: true,
      },
    })

    return this.filterRecipientIds(
      subscriptions.map(subscription => subscription.user_id),
      actorId,
    )
  }

  async getCommentSubscriberIds(commentId: string, actorId?: string): Promise<string[]> {
    const subscriptions = await this.prisma.client.subscription.findMany({
      where: {
        comment_id: commentId,
      },
      select: {
        user_id: true,
      },
    })

    return this.filterRecipientIds(
      subscriptions.map(subscription => subscription.user_id),
      actorId,
    )
  }

  filterRecipientIds(recipientIds: string[], excludedUserId?: string): string[] {
    return [...new Set(recipientIds)].filter(userId => userId && userId !== excludedUserId)
  }

  private getHandler(channelType: NotificationChannelType): NotificationChannelHandler {
    const handler = this.handlersByChannel.get(channelType)
    if (!handler) {
      throw new Error(`Notification channel handler not found for ${channelType}`)
    }

    return handler
  }

  private mapInboxNotification(delivery: InboxNotificationRecord): InboxNotificationListItem {
    const baseNotification = {
      deliveryId: delivery.id,
      channelType: NotificationChannelType.INBOX,
      readAt: delivery.read_at?.getTime() ?? null,
      createdAt: delivery.created_at.getTime(),
    }

    switch (delivery.notification_payload.type as NotificationType) {
      case NotificationType.ISSUE_UPDATED:
        return {
          ...baseNotification,
          type: NotificationType.ISSUE_UPDATED,
          payload: delivery.notification_payload.payload as NotificationPayloadMap[NotificationType.ISSUE_UPDATED],
        }
      case NotificationType.ISSUE_DELETED:
        return {
          ...baseNotification,
          type: NotificationType.ISSUE_DELETED,
          payload: delivery.notification_payload.payload as NotificationPayloadMap[NotificationType.ISSUE_DELETED],
        }
      case NotificationType.COMMENT_CREATED:
        return {
          ...baseNotification,
          type: NotificationType.COMMENT_CREATED,
          payload: delivery.notification_payload.payload as NotificationPayloadMap[NotificationType.COMMENT_CREATED],
        }
      default:
        throw new Error(`Unsupported notification type: ${delivery.notification_payload.type}`)
    }
  }

  private encodeCursor(delivery: Pick<InboxNotificationRecord, 'id' | 'created_at'>): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: delivery.created_at.toISOString(),
        id: delivery.id,
      } satisfies InboxCursor),
    ).toString('base64')
  }

  private decodeCursor(cursor: string): InboxCursor {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as InboxCursor

    if (!parsed.createdAt || !parsed.id) {
      throw new Error('Invalid inbox cursor')
    }

    return parsed
  }
}
