import { http } from 'msw/core/http'

type SessionUser = {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  image: string | null
}

type SessionData = {
  id: string
  expiresAt: string
  token: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type SessionPayload = {
  user: SessionUser
  session: SessionData
}

export const defaultSession: SessionPayload = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    image: null,
  },
  session: {
    id: 'session-1',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    token: 'storybook-session-token',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user-1',
  },
}

export const createSessionHandler = (payload: SessionPayload | null = defaultSession): ReturnType<typeof http.get> =>
  http.get('*/api/auth/get-session', () => Response.json(payload))

export const createSignOutHandler = (): ReturnType<typeof http.post> =>
  http.post('*/api/auth/sign-out', () =>
    Response.json({
      success: true,
    }),
  )
