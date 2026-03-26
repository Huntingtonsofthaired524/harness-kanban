import { useApiServerClient } from '@/hooks/use-api-server'
import { User } from '@repo/shared'
import { useQuery } from '@tanstack/react-query'

interface UsersResponseDto {
  users: User[]
}

export const useUser = (userId?: string) => {
  const apiClient = useApiServerClient()

  const { data, error, isLoading } = useQuery({
    queryKey: ['api-server', 'user', userId],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<UsersResponseDto>(`/api/v1/users?userIds=${userId}`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    enabled: Boolean(userId) && !!apiClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  if (!userId) {
    return {
      user: null,
      error: undefined,
      isLoading: false,
    }
  }

  if (data?.users.length === 0) {
    return {
      user: null,
      error: new Error('User not found'),
      isLoading,
    }
  }

  return {
    user: data?.users[0] ?? null,
    error,
    isLoading,
  }
}
