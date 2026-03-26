import { DatabaseModule } from '@/database/database.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { InboxNotificationChannelHandler } from './inbox-notification-channel.handler'
import { NOTIFICATION_CHANNEL_HANDLERS } from './notification.constants'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    InboxNotificationChannelHandler,
    {
      provide: NOTIFICATION_CHANNEL_HANDLERS,
      useFactory: (inboxHandler: InboxNotificationChannelHandler) => [inboxHandler],
      inject: [InboxNotificationChannelHandler],
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
