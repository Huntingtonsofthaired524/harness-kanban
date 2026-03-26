'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { createWebRuntimeConfig, DEFAULT_WEB_RUNTIME_CONFIG } from '@/lib/runtime-config'
import type { WebRuntimeConfig } from '@/lib/runtime-config'

const RuntimeConfigContext = createContext<WebRuntimeConfig | null>(null)

async function fetchRuntimeConfig(): Promise<WebRuntimeConfig> {
  const response = await fetch('/runtime-config', {
    cache: 'no-store',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(`Failed to load runtime config: ${response.status}`)
  }

  const payload = (await response.json()) as Partial<WebRuntimeConfig>
  return createWebRuntimeConfig(payload)
}

export function RuntimeConfigProvider({ children }: { children: React.ReactNode }) {
  const [runtimeConfig, setRuntimeConfig] = useState<WebRuntimeConfig | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetchRuntimeConfig()
      .then(config => {
        if (!cancelled) {
          setRuntimeConfig(config)
        }
      })
      .catch(error => {
        console.warn('[RuntimeConfig] Falling back to default web runtime config', error)
        if (!cancelled) {
          setRuntimeConfig(DEFAULT_WEB_RUNTIME_CONFIG)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => runtimeConfig, [runtimeConfig])

  if (!value) {
    return null
  }

  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>
}

export function useRuntimeConfig(): WebRuntimeConfig {
  const runtimeConfig = useContext(RuntimeConfigContext)

  if (!runtimeConfig) {
    throw new Error('useRuntimeConfig must be used within a RuntimeConfigProvider')
  }

  return runtimeConfig
}
