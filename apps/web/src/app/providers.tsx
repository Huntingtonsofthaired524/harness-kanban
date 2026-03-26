'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { PropsWithChildren, useMemo } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { createHarnessKanbanAuthClient } from '@/lib/auth/auth-client'
import { AuthClientProvider } from '@/providers/auth-client-provider'
import { useRuntimeConfig } from '@/providers/runtime-config-provider'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'

function BetterAuthLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode
  className?: string
  href: string
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export function Providers({ children }: PropsWithChildren) {
  const router = useRouter()
  const { apiBaseUrl } = useRuntimeConfig()
  const authClient = useMemo(() => createHarnessKanbanAuthClient(apiBaseUrl), [apiBaseUrl])

  return (
    <>
      <AuthClientProvider value={authClient}>
        <AuthUIProvider
          authClient={authClient}
          navigate={router.push}
          replace={router.replace}
          onSessionChange={() => router.refresh()}
          Link={BetterAuthLink}>
          {children}
        </AuthUIProvider>
      </AuthClientProvider>
      <Toaster />
    </>
  )
}
