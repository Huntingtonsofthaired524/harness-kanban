import { ApiResponse } from '@/types/api-server'
import { User } from '@repo/shared'

export const fetchOrganizationMembers = async (
  fetcher: (url: string, options?: RequestInit) => Promise<Response>,
): Promise<User[]> => {
  const url = `/api/v1/users`
  const response = await fetcher(url)
  const { data } = (await response.json()) as ApiResponse<{ users: User[] }>
  return data?.users ?? []
}
