'use client'

import React, { createContext, useContext } from 'react'

import type { HarnessKanbanAuthClient } from '@/lib/auth/auth-client'

const AuthClientContext = createContext<HarnessKanbanAuthClient | null>(null)

export function AuthClientProvider({ children, value }: { children: React.ReactNode; value: HarnessKanbanAuthClient }) {
  return <AuthClientContext.Provider value={value}>{children}</AuthClientContext.Provider>
}

export function useAuthClient(): HarnessKanbanAuthClient {
  const authClient = useContext(AuthClientContext)

  if (!authClient) {
    throw new Error('useAuthClient must be used within an AuthClientProvider')
  }

  return authClient
}
