'use client'

import { useApiServerClient } from '@/hooks/use-api-server'
import { ResolveStatusActionsInput, ResolveStatusActionsResult } from '@repo/shared'
import { useQuery } from '@tanstack/react-query'

type UseStatusActionsOptions = ResolveStatusActionsInput & {
  enabled?: boolean
}

export const useStatusActions = ({ issueId, currentStatusId, enabled = true }: UseStatusActionsOptions) => {
  const apiClient = useApiServerClient()

  return useQuery({
    queryKey: ['api-server', 'status-actions', issueId ?? null, currentStatusId ?? null],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.post<ResolveStatusActionsResult>('/api/v1/issues/status-actions/resolve', {
        issueId,
        currentStatusId,
      })

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    enabled: enabled && !!apiClient && (typeof issueId === 'number' || typeof currentStatusId === 'string'),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
