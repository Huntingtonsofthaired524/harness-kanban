// Activity related types and DTOs

import { Activity } from '@repo/shared/issue/types'

export type CommentActivityDBPayload = {
  commentId: string
}

export interface ActivityQueryResult {
  total: number
  activities: Activity[]
  page?: number
  pageSize?: number
  totalPages?: number
  subscriberIds: string[]
}

export interface SubscribeRequestDto {
  userIds: string[]
}

export interface GetActivitiesResponseDto {
  total: number
  activities: Activity[]
  page?: number
  pageSize?: number
  totalPages?: number
  subscribers: string[]
}

export interface ConstructActivityParams {
  issueId: number
  type: string
  payload: Record<string, unknown>
  createdBy: string
}
