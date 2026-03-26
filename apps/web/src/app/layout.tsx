import '@/app/globals.css'

import { Inter } from 'next/font/google'
import React, { PropsWithChildren } from 'react'

import { ClientInit } from '@/app/init-client'
import { Providers } from '@/app/providers'
import { ApiProvider } from '@/components/common/api-server-provider'
import { AppShell } from '@/components/common/app-shell'
import { cn } from '@/lib/shadcn/utils'
import { QueryProvider } from '@/providers/query-provider'
import { RuntimeConfigProvider } from '@/providers/runtime-config-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Metadata, Viewport } from 'next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Harness Kanban - Agent-Powered Issue Tracking',
  description: 'AI-powered issue tracking with intelligent agents',
  icons: {
    icon: '/logo.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const RootLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <html suppressHydrationWarning className={cn(inter.variable, 'h-full antialiased')} lang="en">
      <body className="font-main flex h-screen flex-col overflow-hidden">
        <RuntimeConfigProvider>
          <Providers>
            <QueryProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
                <ApiProvider>
                  <ClientInit />
                  <AppShell>{children}</AppShell>
                </ApiProvider>
              </ThemeProvider>
            </QueryProvider>
          </Providers>
        </RuntimeConfigProvider>
      </body>
    </html>
  )
}

export default RootLayout
