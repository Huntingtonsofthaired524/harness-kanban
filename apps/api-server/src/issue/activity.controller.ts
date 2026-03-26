import { z } from 'zod'

import { ApiResponse as BaseApiResponse, makeSuccessResponse } from '@/common/responses/api-response'
import { zodParse } from '@/common/zod/zod-parse'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ActivityService } from './activity.service'
import { GetActivitiesResponseDto } from './types/activity.types'

const GetActivitiesQuerySchema = z.object({
  descOrder: z.coerce.boolean().default(true),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

const SubscribeRequestSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user id is required'),
})

const UnsubscribeQuerySchema = z.object({
  userIds: z
    .string()
    .transform(val => val.split(',').filter(Boolean))
    .pipe(z.array(z.string()).min(1, 'At least one user id is required')),
})

@Controller('api/v1/issues')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get(':id/activities')
  async getIssueActivities(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryRaw: unknown,
  ): Promise<BaseApiResponse<GetActivitiesResponseDto>> {
    const query = zodParse(GetActivitiesQuerySchema, queryRaw)

    const result = await this.activityService.getActivities(id, query.descOrder, query.page, query.pageSize)

    const responseData: GetActivitiesResponseDto = {
      ...result,
      activities: result.activities.map(activity => ({
        ...activity,
        issueId: Number(activity.issueId),
      })),
      subscribers: result.subscriberIds,
    }

    return makeSuccessResponse(responseData)
  }

  @Post(':id/activities/subscribers')
  async subscribeToIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body() bodyRaw: unknown,
  ): Promise<BaseApiResponse<void>> {
    const body = zodParse(SubscribeRequestSchema, bodyRaw)

    await this.activityService.subscribeToIssue(id, body.userIds)

    return makeSuccessResponse(undefined)
  }

  @Delete(':id/activities/subscribers')
  async unsubscribeFromIssue(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryRaw: unknown,
  ): Promise<BaseApiResponse<void>> {
    const query = zodParse(UnsubscribeQuerySchema, queryRaw)

    await this.activityService.unsubscribeFromIssue(id, query.userIds)

    return makeSuccessResponse(undefined)
  }
}
