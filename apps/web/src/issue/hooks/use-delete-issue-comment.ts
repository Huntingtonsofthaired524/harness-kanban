'use client'

import { toast } from 'sonner'

import { useApiServerClient } from '@/hooks/use-api-server'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface DeleteCommentInput {
  commentId: string
}

export const useDeleteIssueComment = (issueId: number) => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ commentId }: DeleteCommentInput) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.delete<{ success: boolean }>(`/api/v1/issues/${issueId}/comments/${commentId}`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: () => {
      toast.success('Comment deleted')
      void queryClient.invalidateQueries({ queryKey: ['api-server', 'issueComments', issueId] })
      void queryClient.invalidateQueries({ queryKey: ['api-server', 'issueActivities', issueId] })
    },
    onError: () => {
      toast.error('Failed to delete comment')
    },
  })

  return mutation
}
