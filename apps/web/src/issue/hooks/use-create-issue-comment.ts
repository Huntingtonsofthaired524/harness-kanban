'use client'

import { useApiServerClient } from '@/hooks/use-api-server'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface IssueComment {
  id: string
  content: string
  createdAt: number
  userId: string
}

interface Comment {
  id: string
  issueId: number
  content: string
  createdBy: string
  parentId?: string | null
  createdAt: number
  updatedAt: number
  subComments?: Comment[]
}

interface GetCommentsResponseDto {
  comments: Comment[]
}

interface CreateCommentResponseDto {
  comment: Comment
}

// Convert API Comment to legacy IssueComment for backward compatibility
const convertToIssueComment = (comment: Comment): IssueComment => ({
  id: comment.id,
  content: comment.content,
  createdAt: comment.createdAt,
  userId: comment.createdBy,
})

export const useIssueComments = (issueId: number) => {
  const apiClient = useApiServerClient()

  return useQuery<IssueComment[]>({
    queryKey: ['api-server', 'issueComments', issueId],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetCommentsResponseDto>(`/api/v1/issues/${issueId}/comments`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data.comments.map(convertToIssueComment)
    },
    enabled: Boolean(issueId) && !!apiClient,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateIssueComment = (issueId: number) => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.post<CreateCommentResponseDto>(`/api/v1/issues/${issueId}/comments`, {
        content,
      })

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return convertToIssueComment(response.data.comment)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-server', 'issueComments', issueId] })
      queryClient.invalidateQueries({ queryKey: ['api-server', 'issueActivities', issueId] })
    },
  })
}
