'use client'

import { cn } from '@/lib/shadcn/utils'
import { AgentChatHeader } from './agent-chat-header'
import { AgentEmptyState } from './agent-empty-state'
import { AgentMessageList } from './agent-message-list'
import { AgentMessageSkeleton } from './agent-message-skeleton'
import { AgentPromptInput } from './agent-prompt-input'
import type { AgentChatProps } from './types'

export function AgentChat({
  messages,
  onSend,
  isLoading,
  status,
  error,
  placeholder,
  onClose,
  onReset,
  onSelectConversation,
  pastConversations,
  currentChatId,
  className,
  onStop,
}: AgentChatProps) {
  const hasMessages = messages.length > 0

  return (
    <div className={cn('bg-background flex h-full flex-col border-l', className)}>
      {/* Header */}
      <AgentChatHeader
        onClose={onClose}
        onReset={onReset}
        onSelectConversation={onSelectConversation}
        pastConversations={pastConversations}
        currentChatId={currentChatId}
      />

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl">
              <AgentMessageSkeleton count={4} />
            </div>
          </div>
        ) : hasMessages ? (
          <AgentMessageList messages={messages} status={status} />
        ) : (
          <AgentEmptyState />
        )}
      </div>

      {/* Error Display */}
      {error && <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">Error: {error.message}</div>}

      {/* Input Area */}
      <div className="p-4">
        <AgentPromptInput
          onSend={onSend}
          status={status}
          disabled={isLoading}
          placeholder={placeholder}
          onStop={onStop}
        />
      </div>
    </div>
  )
}
