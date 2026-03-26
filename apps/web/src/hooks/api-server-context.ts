import { createContext } from 'react'

export const apiContext = createContext<{
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>
  getToken: () => Promise<string | null>
} | null>(null)
