'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/shadcn/utils'

export const RouteBreadcrumbs: React.FC = () => {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isRoot = index === 0
    const isLast = index === segments.length - 1

    return (
      <div key={href} className="flex items-center space-x-1">
        {index > 0 && <ChevronRight className="text-muted-foreground h-4 w-4" />}
        {isLast ? (
          <span
            className={cn('text-muted-foreground text-sm font-light capitalize', {
              'px-2': isRoot,
            })}>
            {segment}
          </span>
        ) : (
          <Link href={href}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-light capitalize">
              {segment}
            </Button>
          </Link>
        )}
      </div>
    )
  })

  return <div className="flex items-center space-x-1">{items}</div>
}
