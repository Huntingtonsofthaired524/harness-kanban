import 'server-only'

import { createWebRuntimeConfig } from '@/lib/runtime-config'

export function getServerRuntimeConfig() {
  return createWebRuntimeConfig({
    apiBaseUrl: process.env.RUNTIME_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_SERVER_URL,
    socketServerUrl: process.env.RUNTIME_SOCKET_SERVER_URL,
  })
}
