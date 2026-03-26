import '@/app/globals.css'
// Import init-client to register property renderers
import '@/init-client'

import { initialize, mswLoader } from 'msw-storybook-addon'
import { INITIAL_VIEWPORTS } from 'storybook/viewport'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import React, { useState } from 'react'

import { withThemeByClassName } from '@storybook/addon-themes'
import { AppProviders } from './components'
import { defaultMswHandlerGroups } from './msw'
import type { Preview } from '@storybook/react'

/*
 * Initializes MSW
 * See https://github.com/mswjs/msw-storybook-addon#configuring-msw
 * to learn how to customize it
 */
initialize({
  onUnhandledRequest: 'bypass',
})

// Mock App Router context for components using next/navigation
const mockRouter = {
  push: () => Promise.resolve(false),
  replace: () => Promise.resolve(false),
  refresh: () => {},
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
}

const WithAppRouter = (Story: React.FC) => {
  const [searchParams] = useState(() => new URLSearchParams())

  return (
    <AppRouterContext.Provider value={mockRouter as any}>
      <SearchParamsContext.Provider value={searchParams}>
        <AppProviders>
          <Story />
        </AppProviders>
      </SearchParamsContext.Provider>
    </AppRouterContext.Provider>
  )
}

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    WithAppRouter,
  ],
  parameters: {
    viewport: {
      options: INITIAL_VIEWPORTS,
    },
    msw: {
      handlers: defaultMswHandlerGroups,
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#000000' },
      ],
    },
  },
  loaders: [mswLoader],
}

export default preview
