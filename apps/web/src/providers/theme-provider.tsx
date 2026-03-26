'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React from 'react'

export const ThemeProvider = ({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
)
