import { useApiServerClient } from '@/hooks/use-api-server'
import { useQuery } from '@tanstack/react-query'
import type { UIMessage } from '@ai-sdk/react'

export interface ChatHistoryResponse {
  id: string
  title: string | null
  createdAt: string
  messages: UIMessage[]
}

/**
 * Hook to fetch chat history using TanStack Query
 */
export const useChatHistory = (chatId: string | undefined) => {
  const apiClient = useApiServerClient()

  const { data, error, isLoading } = useQuery({
    queryKey: ['api-server', 'agent', 'chat', chatId, 'history'],
    queryFn: async () => {
      if (!apiClient || !chatId) {
        throw new Error('API client or chatId not available')
      }

      const response = await apiClient.get<ChatHistoryResponse>(`/api/v1/agent/chat/${chatId}/history`)

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch chat history')
      }

      return response.data
    },
    enabled: Boolean(chatId) && !!apiClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    chat: data,
    messages: data?.messages ?? [],
    error,
    isLoading,
  }
}
