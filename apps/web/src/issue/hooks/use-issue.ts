import { useApiServerClient } from '@/hooks/use-api-server'
import { Issue } from '@repo/shared/property/types'
import { useQuery } from '@tanstack/react-query'

interface GetIssueResponseDto {
  issue: Issue
}

export const useIssue = (issueId: number) => {
  const apiClient = useApiServerClient()

  const { data, error, isLoading } = useQuery({
    queryKey: ['api-server', 'issue', issueId],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetIssueResponseDto>(`/api/v1/issues/${issueId}`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    enabled: Boolean(issueId) && !!apiClient,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    issue: data?.issue,
    error,
    isLoading,
  }
}
