import { useApiServerClient } from '@/hooks/use-api-server'
import { useQuery } from '@tanstack/react-query'

interface ChatListItem {
  id: string
  title: string | null
  updatedAt: string
}

/**
 * Hook to fetch chat list using TanStack Query
 */
export const useChatList = () => {
  const apiClient = useApiServerClient()

  const { data, error, isLoading } = useQuery({
    queryKey: ['api-server', 'agent', 'chats'],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<ChatListItem[]>('/api/v1/agent/chats')

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch chat list')
      }

      return response.data
    },
    enabled: !!apiClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    chats: data,
    error,
    isLoading,
  }
}
