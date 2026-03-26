'use client'

import { History, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/shadcn/utils'
import type { AgentChatHeaderProps } from './types'

function formatConversationTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}m ago`
  }
  if (hours < 24) {
    return `${hours}h ago`
  }
  if (days < 7) {
    return `${days}d ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function AgentChatHeader({
  onClose,
  onReset,
  onSelectConversation,
  pastConversations = [],
  currentChatId,
  className,
}: AgentChatHeaderProps) {
  const hasConversations = pastConversations.length > 0

  return (
    <header className={cn('flex h-10 items-center justify-between gap-1 px-2', className)}>
      {/* Left: Past Conversations Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
            <History className="size-4" />
            <span className="text-sm">History</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="flex w-64 flex-col p-0">
          <DropdownMenuLabel className="px-2 py-1.5">Past Conversations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto py-1">
            {hasConversations ? (
              pastConversations.map(conversation => (
                <DropdownMenuItem
                  key={conversation.id}
                  onClick={() => onSelectConversation?.(conversation.id)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between px-2',
                    currentChatId === conversation.id && 'bg-accent',
                  )}>
                  <span className="truncate pr-2">{conversation.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatConversationTime(conversation.updatedAt)}
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground px-2">
                No conversations yet
              </DropdownMenuItem>
            )}
          </div>
          {onReset && (
            <>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem onClick={onReset} className="cursor-pointer px-2">
                  <Plus className="mr-2 size-4" />
                  New Conversation
                </DropdownMenuItem>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {onReset && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onReset} className="size-8">
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Conversation</TooltipContent>
          </Tooltip>
        )}
        {onClose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
                <X className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  )
}
