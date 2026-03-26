'use client'

import { Bot } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useResizableWidth } from '@/hooks/use-resizable-width'
import { cn } from '@/lib/shadcn/utils'
import { AgentChatContainer } from './agent-chat-container'

export interface SideChatProps {
  chatId?: string
  className?: string
}

const STORAGE_KEY = 'sidechat-width'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 800

export function SideChat({ className }: SideChatProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [resetKey, setResetKey] = React.useState(0)
  const { width, isResizing, resizeHandleProps } = useResizableWidth({
    storageKey: STORAGE_KEY,
    defaultWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
  })

  const handleOpen = React.useCallback(() => setIsOpen(true), [])
  const handleClose = React.useCallback(() => setIsOpen(false), [])
  const handleReset = React.useCallback(() => {
    setResetKey(prev => prev + 1)
  }, [])

  return (
    <>
      {/* Toggle Button - fixed to right edge at 3/4 position */}
      {!isOpen && (
        <div
          className={cn(
            'fixed right-0 top-[75%] z-50 -translate-y-1/2',
            'transition-all duration-300 ease-in-out',
            className,
          )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleOpen}
                size="icon"
                className="h-12 w-9 rounded-l-md rounded-r-none shadow-md"
                aria-label="Open chat">
                <Bot className="size-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Open AI Assistant</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Side Panel - conditionally rendered to avoid layout shift */}
      {isOpen && (
        <div
          className={cn(
            'bg-background relative flex h-screen flex-col border-l',
            isResizing && 'select-none',
            className,
          )}
          style={{ width }}>
          {/* Resize Handle */}
          <div
            {...resizeHandleProps}
            className={cn(
              'absolute bottom-0 left-0 top-0 z-10 w-1 cursor-col-resize',
              'hover:bg-primary/20 active:bg-primary/30',
              'transition-colors duration-150',
              isResizing && 'bg-primary/30',
            )}
            aria-label="Resize chat panel"
            role="separator"
          />
          {/* Chat Content - AgentChatContainer includes header with close button */}
          <div className="flex-1 overflow-hidden pl-1">
            <AgentChatContainer
              key={resetKey}
              onClose={handleClose}
              onReset={handleReset}
              className="h-full border-l-0"
            />
          </div>
        </div>
      )}
    </>
  )
}
