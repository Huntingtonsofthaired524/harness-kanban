import { useApiServerClient } from '@/hooks/use-api-server'
import { GetProjectResponseDto } from '@repo/shared/project/types'
import { useQuery } from '@tanstack/react-query'

export const useProject = (projectId: string) => {
  const apiClient = useApiServerClient()

  return useQuery({
    queryKey: ['api-server', 'project', projectId],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetProjectResponseDto>(`/api/v1/projects/${projectId}`)
      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data.project
    },
    enabled: Boolean(projectId) && !!apiClient,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
