import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { NotificationChannelType } from '@repo/shared'
import { DeliverNotificationRequest, NotificationChannelHandler } from './notification.types'

@Injectable()
export class InboxNotificationChannelHandler implements NotificationChannelHandler {
  readonly channelType = NotificationChannelType.INBOX

  constructor(private readonly prisma: PrismaService) {}

  async deliver({ notificationPayloadId, userIds }: DeliverNotificationRequest): Promise<void> {
    const uniqueUserIds = [...new Set(userIds)]
    if (uniqueUserIds.length === 0) {
      return
    }

    await this.prisma.client.notification_delivery.createMany({
      data: uniqueUserIds.map(userId => ({
        notification_payload_id: notificationPayloadId,
        user_id: userId,
        channel_type: this.channelType,
      })),
      skipDuplicates: true,
    })
  }
}
