import { http } from 'msw/core/http'

import type { User } from '@repo/shared'

export type MockUser = User

export const defaultUsers: MockUser[] = [
  {
    id: 'user-1',
    username: 'Alice',
    imageUrl: '',
    hasImage: false,
  },
  {
    id: 'user-2',
    username: 'Bob',
    imageUrl: '',
    hasImage: false,
  },
  {
    id: 'user-3',
    username: 'Charlie',
    imageUrl: '',
    hasImage: false,
  },
]

export const createUsersHandler = (users: MockUser[] = defaultUsers): ReturnType<typeof http.get> =>
  http.get('*/api/v1/users', ({ request }) => {
    const url = new URL(request.url)
    const rawUserIds = url.searchParams.get('userIds')
    const userIds = rawUserIds?.split(',').filter(Boolean) ?? []
    const filteredUsers = userIds.length ? users.filter(user => userIds.includes(user.id)) : users

    return Response.json({
      success: true,
      data: {
        users: filteredUsers,
      },
      error: null,
    })
  })
