import { createAuthClient } from 'better-auth/react'

export const createHarnessKanbanAuthClient = (baseURL: string) =>
  createAuthClient({
    baseURL,
    fetchOptions: {
      credentials: 'include',
    },
  })

export type HarnessKanbanAuthClient = ReturnType<typeof createHarnessKanbanAuthClient>
