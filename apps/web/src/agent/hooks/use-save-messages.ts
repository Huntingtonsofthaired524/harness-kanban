import { useApiServerClient } from '@/hooks/use-api-server'
import { useMutation } from '@tanstack/react-query'
import type { UIMessage } from '@ai-sdk/react'

interface SaveMessagesRequest {
  messages: UIMessage[]
}

interface SaveMessagesResponse {
  success: boolean
}

/**
 * Hook to save chat messages using TanStack Query mutation
 */
export const useSaveMessages = () => {
  const apiClient = useApiServerClient()

  const { mutateAsync, error, isPending } = useMutation({
    mutationFn: async ({ chatId, messages }: { chatId: string; messages: UIMessage[] }) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.post<SaveMessagesResponse>(`/api/v1/agent/chat/${chatId}/messages`, {
        messages,
      } as SaveMessagesRequest)

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to save messages')
      }

      return response.data
    },
  })

  return {
    saveMessages: mutateAsync,
    error,
    isLoading: isPending,
  }
}
