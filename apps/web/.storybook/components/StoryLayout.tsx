import React from 'react'

import { ClientInit } from '@/app/init-client'
import { Providers } from '@/app/providers'
import { ApiProvider } from '@/components/common/api-server-provider'
import { AppShellFrame, AppSidebarView } from '@/components/common/app-shell'
import { UserButtonCustomView } from '@/components/common/user-button-custom'
import { QueryProvider } from '@/providers/query-provider'
import { RuntimeConfigProvider } from '@/providers/runtime-config-provider'
import { ThemeProvider } from '@/providers/theme-provider'

/**
 * Storybook Root Layout
 * Exactly mirrors the structure from app/layout.tsx
 * Use this wrapper for page-level stories to get 1:1 layout behavior
 */
export const StoryLayout: React.FC<{ children: React.ReactNode; pathname?: string }> = ({
  children,
  pathname = '/issues',
}) => {
  return (
    <AppShellFrame
      sidebar={
        <AppSidebarView
          pathname={pathname}
          mounted={true}
          theme="light"
          onToggleTheme={() => {}}
          userControl={
            <UserButtonCustomView
              size="icon"
              align="start"
              side="right"
              user={{
                id: 'story-user',
                name: 'Story User',
                email: 'story@example.com',
                image: null,
              }}
              mounted={true}
              isPending={false}
              signOutPending={false}
              onSignOut={async () => {}}
              classNames={{
                trigger: {
                  base: 'h-10 w-10 rounded-xl border border-transparent p-0 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent',
                  avatar: 'rounded-xl',
                },
                content: {
                  base: 'ml-2',
                },
              }}
            />
          }
        />
      }>
      {children}
    </AppShellFrame>
  )
}

/**
 * Full App Providers Wrapper
 * Mirrors: RuntimeConfigProvider > Providers > QueryProvider > ThemeProvider > ApiProvider > ClientInit
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RuntimeConfigProvider>
      <Providers>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange={true}>
            <ApiProvider>
              <ClientInit />
              {children}
            </ApiProvider>
          </ThemeProvider>
        </QueryProvider>
      </Providers>
    </RuntimeConfigProvider>
  )
}
