import { AuthModule } from '@/auth/auth.module'
import { DatabaseModule } from '@/database/database.module'
import { NotificationModule } from '@/notification/notification.module'
import { PropertyModule } from '@/property/property.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'
import { IssueEventListeners } from './event-listeners/event-listeners'
import { IssueNotificationEventListeners } from './event-listeners/notification.event-listeners'
import { IssueController } from './issue.controller'
import { IssueService } from './issue.service'

@Module({
  imports: [DatabaseModule, AuthModule, PropertyModule, NotificationModule, UserModule],
  controllers: [IssueController, ActivityController, CommentController],
  providers: [IssueService, ActivityService, CommentService, IssueEventListeners, IssueNotificationEventListeners],
  exports: [IssueService, CommentService, ActivityService],
})
export class IssueModule {}
