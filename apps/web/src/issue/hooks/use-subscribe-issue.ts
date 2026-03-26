'use client'

import { useApiServerClient } from '@/hooks/use-api-server'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface SubscribeToIssueInput {
  userIds: string[]
}

export const useSubscribeIssue = (issueId: number) => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ userIds }: SubscribeToIssueInput) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.post<void>(`/api/v1/issues/${issueId}/activities/subscribers`, {
        userIds,
      })

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
    subscribeToIssue: mutation.mutateAsync,
    error: mutation.error,
    isMutating: mutation.isPending,
  }
}
