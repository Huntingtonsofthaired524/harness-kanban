'use client'

import { toast } from 'sonner'
import React, { PropsWithChildren, useState } from 'react'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const QueryProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: error => {
            toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
