export interface WebRuntimeConfig {
  apiBaseUrl: string
  socketServerUrl: string
}

const DEFAULT_API_BASE_URL = 'http://localhost:3001'

export function normalizeBaseUrl(value: null | string | undefined, fallback: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    return fallback
  }

  return normalized.replace(/\/+$/, '')
}

export function createWebRuntimeConfig(input?: Partial<WebRuntimeConfig>): WebRuntimeConfig {
  const apiBaseUrl = normalizeBaseUrl(input?.apiBaseUrl, DEFAULT_API_BASE_URL)
  const socketServerUrl = normalizeBaseUrl(input?.socketServerUrl, apiBaseUrl)

  return {
    apiBaseUrl,
    socketServerUrl,
  }
}

export const DEFAULT_WEB_RUNTIME_CONFIG = createWebRuntimeConfig()
