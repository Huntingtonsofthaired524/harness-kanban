'use client'

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { cn } from '@/lib/shadcn/utils'
import { AgentMessage } from './agent-message'
import type { AgentMessageListProps } from './types'

export function AgentMessageList({ messages, status, className }: AgentMessageListProps) {
  return (
    <Conversation className={cn('h-full', className)}>
      <ConversationContent className="p-4">
        <div className="flex w-full max-w-3xl flex-col gap-6 self-center">
          {messages.map(message => (
            <AgentMessage key={message.id} message={message} />
          ))}

          {/* Waiting indicator */}
          {(status === 'submitted' || status === 'streaming') && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl px-4 py-2.5">
                <span className="bg-foreground/50 size-1.5 animate-bounce rounded-full" />
                <span
                  className="bg-foreground/50 size-1.5 animate-bounce rounded-full"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="bg-foreground/50 size-1.5 animate-bounce rounded-full"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          )}
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
