'use client'

import { Send, Square } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/shadcn/utils'
import type { AgentPromptInputProps } from './types'

export function AgentPromptInput({
  onSend,
  status,
  disabled,
  placeholder = 'Type your message...',
  className,
  onStop,
}: AgentPromptInputProps) {
  const [value, setValue] = useState('')

  const isWaitingStream = status === 'submitted' || status === 'streaming'

  const handleSend = () => {
    if (value.trim() && !isWaitingStream && !disabled) {
      onSend(value.trim())
      setValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = () => {
    if (isWaitingStream && onStop) {
      onStop()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isWaitingStream}
        className="min-h-[80px] resize-none pb-12 pr-12"
        rows={1}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={isWaitingStream ? handleStop : handleSend}
            disabled={(!isWaitingStream && !value.trim()) || disabled}
            size="icon"
            className="absolute bottom-2 right-2 size-8 cursor-pointer rounded-full">
            {isWaitingStream ? <Square className="size-4 fill-current" /> : <Send className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isWaitingStream ? 'Stop' : 'Send'}</TooltipContent>
      </Tooltip>
    </div>
  )
}
