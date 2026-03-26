'use client'

import { toast } from 'sonner'

import { Comment } from '@repo/shared/issue/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiServerClient } from '../../hooks/use-api-server'

export interface UpdateCommentInput {
  commentId: string
  content: string
}

export const useUpdateIssueComment = (issueId: number) => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, content }: UpdateCommentInput) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.patch<{ comment: Comment }>(`/api/v1/issues/${issueId}/comments/${commentId}`, {
        content,
      })
      if (!response.success) {
        throw new Error(response.error.message)
      }
      return response.data
    },
    onSuccess: () => {
      toast.success('Comment updated successfully')
      queryClient.invalidateQueries({ queryKey: ['api-server', 'issueComments', issueId] })
      queryClient.invalidateQueries({ queryKey: ['api-server', 'issueActivities', issueId] })
    },
    onError: () => {
      toast.error('Failed to update comment')
    },
  })
}
