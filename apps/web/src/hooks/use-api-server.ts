/**
 * API Server Hooks
 * React Query hooks for communicating with NestJS API Server
 */

import { useMemo } from 'react'

import { createApiServerClient } from '@/lib/api-server-client'
import { useRuntimeConfig } from '@/providers/runtime-config-provider'

/**
 * Hook to get API server client (using cookie session)
 */
export const useApiServerClient = () => {
  const { apiBaseUrl } = useRuntimeConfig()

  const client = useMemo(() => {
    // Create client without token - better auth will handle authentication via cookies
    return createApiServerClient({ baseURL: apiBaseUrl })
  }, [apiBaseUrl])

  return client
}
