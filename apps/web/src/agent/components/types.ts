import type { UIMessage } from '@ai-sdk/react'

export type MessageRole = 'user' | 'assistant' | 'system'

/** Chat status from useChat */
export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error'

export interface AgentChatProps {
  messages: UIMessage[]
  onSend: (message: string) => void
  /** Loading chat history from server */
  isLoading?: boolean
  /** Chat status from useChat */
  status?: ChatStatus
  error?: Error | null
  placeholder?: string
  onClose?: () => void
  onReset?: () => void
  onSelectConversation?: (id: string) => void
  pastConversations?: PastConversation[]
  currentChatId?: string
  className?: string
  onStop?: () => void
}

export interface AgentMessageListProps {
  messages: UIMessage[]
  /** Chat status from useChat */
  status?: ChatStatus
  className?: string
}

export interface AgentMessageProps {
  message: UIMessage
  className?: string
}

export interface AgentPromptInputProps {
  onSend: (message: string) => void
  /** Chat status from useChat */
  status?: ChatStatus
  disabled?: boolean
  placeholder?: string
  className?: string
  onStop?: () => void
}

export interface PastConversation {
  id: string
  title: string
  updatedAt: Date
}

export interface AgentChatHeaderProps {
  onClose?: () => void
  onReset?: () => void
  onSelectConversation?: (id: string) => void
  pastConversations?: PastConversation[]
  currentChatId?: string
  className?: string
}

export interface AgentEmptyStateProps {
  title?: string
  description?: string
  className?: string
}

export interface SideChatProps {
  chatId?: string
  className?: string
}
