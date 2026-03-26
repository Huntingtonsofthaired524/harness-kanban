import { useApiServerClient } from '@/hooks/use-api-server'
import { PropertyDefinition as ServerProperty } from '@repo/shared/property/types'
import { useQuery } from '@tanstack/react-query'

export const useServerProperties = () => {
  const apiClient = useApiServerClient()

  const { data, error, isLoading } = useQuery({
    queryKey: ['api-server', 'properties'],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<{ properties: ServerProperty[] }>('/api/v1/properties')

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    enabled: !!apiClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    properties: data?.properties,
    error,
    isLoading,
  }
}
