'use client'

import { useApiServerClient } from '@/hooks/use-api-server'
import { User } from '@repo/shared'
import { useQuery } from '@tanstack/react-query'

type UseOrganizationMembersResult = {
  data: User[]
  isLoading: boolean
  error?: Error | null
}

interface UsersResponseDto {
  users: User[]
}

export const useOrganizationMembers = (): UseOrganizationMembersResult => {
  const apiClient = useApiServerClient()

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[], Error>({
    queryKey: ['api-server', 'users'],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<UsersResponseDto>('/api/v1/users')

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data.users ?? []
    },
    enabled: !!apiClient,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    data: users ?? [],
    isLoading,
    error,
  }
}
