'use client'

import { useApiServerClient } from '@/hooks/use-api-server'
import { Activity } from '@repo/shared/issue/types'
import { useQuery } from '@tanstack/react-query'

export interface IssueActivityResult {
  total: number
  activities: Activity[]
  page?: number
  pageSize?: number
  totalPages?: number
  subscriberIds: string[]
}

interface GetActivitiesResponseDto {
  total: number
  activities: Activity[]
  page?: number
  pageSize?: number
  totalPages?: number
  subscribers: string[]
}

export const useIssueActivities = (issueId: number) => {
  const apiClient = useApiServerClient()

  return useQuery<IssueActivityResult>({
    queryKey: ['api-server', 'issueActivities', issueId],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetActivitiesResponseDto>(`/api/v1/issues/${issueId}/activities`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      // Convert response format for backward compatibility
      return {
        total: response.data.total,
        activities: response.data.activities,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: response.data.totalPages,
        subscriberIds: response.data.subscribers, // Map subscribers to subscriberIds
      }
    },
    enabled: Boolean(issueId) && !!apiClient,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}
