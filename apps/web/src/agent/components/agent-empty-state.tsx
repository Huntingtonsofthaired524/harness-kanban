'use client'

import { Bot, Sparkles } from 'lucide-react'

import { cn } from '@/lib/shadcn/utils'
import type { AgentEmptyStateProps } from './types'

export function AgentEmptyState({
  title = 'How can I assist you today?',
  description = 'I can act on your behalf to perform various tasks in the system.',
  className,
}: AgentEmptyStateProps) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center p-8', className)}>
      <div className="relative">
        <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
          <Bot className="text-primary size-8" />
        </div>
        <div className="bg-background absolute -right-1 -top-1 rounded-full p-0.5">
          <Sparkles className="text-primary size-4" />
        </div>
      </div>

      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm">{description}</p>

      <div className="mt-8 grid gap-3 text-sm">
        <div className="text-muted-foreground flex items-center gap-2">
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs">Tip</span>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  )
}
