'use client'

import { useMemoizedFn } from 'ahooks'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import React, { useEffect, useState } from 'react'

import { LayoutSlot } from '@/components/layout/layout-slot'
import { ComponentSlot } from '../layout/component-slot'
import { UserButtonCustom } from './user-button-custom'

export const Header: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = useMemoizedFn(() => {
    if (!mounted) return
    setTheme(theme === 'light' ? 'dark' : 'light')
  })

  return (
    <div className="bg-background sticky top-0 z-40 w-full border-b">
      <LayoutSlot className="container mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between gap-2 px-2 md:px-6">
        <LayoutSlot className="flex-1 p-2" />

        <ComponentSlot className="h-12 p-2">
          <div
            className="flex size-5 cursor-pointer items-center justify-center rounded-full text-lg"
            onClick={toggleTheme}>
            {mounted ? theme === 'dark' ? <SunIcon /> : <MoonIcon strokeWidth={1.5} /> : <div className="size-5" />}
          </div>
        </ComponentSlot>

        <ComponentSlot className="h-12 p-2">
          {mounted ? (
            <UserButtonCustom className="bg-background text-foreground hover:bg-muted" size="icon" align="end" />
          ) : (
            <div className="h-12 w-20" />
          )}
        </ComponentSlot>
      </LayoutSlot>
    </div>
  )
}
