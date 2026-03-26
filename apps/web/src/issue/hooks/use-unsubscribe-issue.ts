'use client'

import { useApiServerClient } from '@/hooks/use-api-server'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface UnsubscribeFromIssueInput {
  userIds: string[]
}

export const useUnsubscribeIssue = (issueId: number) => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ userIds }: UnsubscribeFromIssueInput) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const userIdsParam = userIds.join(',')
      const response = await apiClient.delete<void>(
        `/api/v1/issues/${issueId}/activities/subscribers?userIds=${encodeURIComponent(userIdsParam)}`,
      )

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: () => {
      // Invalidate activities query to refresh subscribers list
      void queryClient.invalidateQueries({ queryKey: ['api-server', 'issueActivities', issueId] })
    },
  })

  return {
    unsubscribeFromIssue: mutation.mutateAsync,
    error: mutation.error,
    isMutating: mutation.isPending,
  }
}
