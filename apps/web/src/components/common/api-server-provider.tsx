'use client'

import { useCallback } from 'react'

import { apiContext } from '@/hooks/api-server-context'
import { useRuntimeConfig } from '@/providers/runtime-config-provider'

export const ApiProvider = ({ children }: { children: React.ReactNode }) => {
  const { apiBaseUrl } = useRuntimeConfig()

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const response = await fetch(`${apiBaseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      })

      return response
    },
    [apiBaseUrl],
  )

  return (
    <apiContext.Provider value={{ authenticatedFetch, getToken: () => Promise.resolve(null) }}>
      {children}
    </apiContext.Provider>
  )
}
