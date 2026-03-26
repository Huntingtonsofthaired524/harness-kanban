import { z } from 'zod'

import { makeSuccessResponse } from '@/common/responses/api-response'
import { zodParse } from '@/common/zod/zod-parse'
import { Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { NotificationService } from './notification.service'
import type { ApiResponse } from '@/common/responses/api-response'
import type {
  GetInboxNotificationsResponse,
  GetUnreadNotificationCountResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from '@repo/shared'

const ListInboxNotificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

const DeliveryIdParamSchema = z.object({
  deliveryId: z.string().min(1),
})

@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('inbox')
  async listInboxNotifications(
    @Query() queryRaw: unknown,
    @Session() session: UserSession,
  ): Promise<ApiResponse<GetInboxNotificationsResponse>> {
    const query = zodParse(ListInboxNotificationsQuerySchema, queryRaw)
    const result = await this.notificationService.listInboxNotifications(session.user.id, query)
    return makeSuccessResponse(result)
  }

  @Get('inbox/unread-count')
  async getUnreadInboxCount(@Session() session: UserSession): Promise<ApiResponse<GetUnreadNotificationCountResponse>> {
    const result = await this.notificationService.getUnreadInboxCount(session.user.id)
    return makeSuccessResponse(result)
  }

  @Patch('inbox/:deliveryId/read')
  async markInboxNotificationRead(
    @Param() paramsRaw: unknown,
    @Session() session: UserSession,
  ): Promise<ApiResponse<MarkNotificationReadResponse>> {
    const params = zodParse(DeliveryIdParamSchema, paramsRaw)
    const result = await this.notificationService.markInboxNotificationRead(session.user.id, params.deliveryId)
    return makeSuccessResponse(result)
  }

  @Patch('inbox/read-all')
  async markAllInboxNotificationsRead(
    @Session() session: UserSession,
  ): Promise<ApiResponse<MarkAllNotificationsReadResponse>> {
    const result = await this.notificationService.markAllInboxNotificationsRead(session.user.id)
    return makeSuccessResponse(result)
  }
}
