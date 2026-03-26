import { useApiServerClient } from '@/hooks/use-api-server'
import { useMutation } from '@tanstack/react-query'

export const useDeleteIssue = (issueId: number) => {
  const apiClient = useApiServerClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.delete<null>(`/api/v1/issues/${issueId}`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
  })

  return {
    deleteIssue: mutation.mutateAsync,
    error: mutation.error,
    isMutating: mutation.isPending,
  }
}
