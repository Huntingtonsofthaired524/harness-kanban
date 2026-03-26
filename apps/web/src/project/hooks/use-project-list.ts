import { useApiServerClient } from '@/hooks/use-api-server'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { GetProjectsResponseDto } from '@repo/shared/project/types'
import { useQuery } from '@tanstack/react-query'

export const useProjectList = () => {
  const apiClient = useApiServerClient()
  const orgId = DEFAULT_WORKSPACE_ID

  return useQuery({
    queryKey: ['api-server', 'projects', orgId],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetProjectsResponseDto>('/api/v1/projects')
      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data.projects
    },
    enabled: !!apiClient,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
