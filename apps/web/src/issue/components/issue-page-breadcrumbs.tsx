'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import { resolveIssueBackTarget } from '@/issue/utils/navigation-context'

interface IssuePageBreadcrumbsProps {
  currentLabel: string
  context?: Parameters<typeof resolveIssueBackTarget>[0]
}

export const IssuePageBreadcrumbs: React.FC<IssuePageBreadcrumbsProps> = ({ currentLabel, context }) => {
  const backTarget = resolveIssueBackTarget(context)

  return (
    <div className="flex items-center space-x-1">
      <Link href={backTarget.href}>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-light">
          {backTarget.label}
        </Button>
      </Link>
      <ChevronRight className="text-muted-foreground h-4 w-4" />
      <span className="text-muted-foreground px-2 text-sm font-light">{currentLabel}</span>
    </div>
  )
}
