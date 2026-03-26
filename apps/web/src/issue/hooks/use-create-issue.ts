import { useApiServerClient } from '@/hooks/use-api-server'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { PropertyValue } from '@repo/shared/property/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateIssueResponseDto {
  issueId: number
}

export const useCreateIssue = () => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()
  const orgId = DEFAULT_WORKSPACE_ID

  const mutation = useMutation({
    mutationFn: async ({ propertyValues }: { propertyValues: PropertyValue[] }) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.post<CreateIssueResponseDto>('/api/v1/issues', {
        issue: { propertyValues },
      })

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['api-server', 'issues', orgId] })
      void queryClient.invalidateQueries({ queryKey: ['api-server', 'issues-infinite', orgId] })
    },
  })

  return {
    createIssue: mutation.mutateAsync,
    issueId: mutation.data?.issueId,
    error: mutation.error,
    isMutating: mutation.isPending,
  }
}
